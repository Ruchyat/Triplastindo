<?php

namespace App\Services\Receivables;

use App\Enums\DocumentStatus;
use App\Enums\JournalSource;
use App\Enums\ReceiptStatus;
use App\Exceptions\PaymentReceiptException;
use App\Models\Account;
use App\Models\JournalEntry;
use App\Models\PaymentAllocation;
use App\Models\PaymentReceipt;
use App\Models\SalesInvoice;
use App\Models\User;
use App\Services\Accounting\JournalDraft;
use App\Services\Accounting\JournalLineDraft;
use App\Services\Accounting\JournalPoster;
use App\Services\DocumentNumberGenerator;
use Illuminate\Support\Facades\DB;

/**
 * Mencatat dan membatalkan penerimaan pembayaran dari customer.
 *
 * Inilah yang menutup siklus akrual penjualan: invoice membentuk piutang,
 * penerimaan menguranginya. Tanpa service ini piutang hanya bertambah dan
 * tidak pernah lunas.
 */
final class PaymentReceiptPoster
{
    private const PREFIX = 'BKM';

    public function __construct(
        private readonly JournalPoster $journals = new JournalPoster,
        private readonly DocumentNumberGenerator $numbers = new DocumentNumberGenerator,
    ) {}

    /** @throws PaymentReceiptException */
    public function create(PaymentReceiptData $data, User $user): PaymentReceipt
    {
        $invoices = $this->validate($data);

        return DB::transaction(function () use ($data, $user, $invoices) {
            $receipt = $this->store($data, $user);
            $entry = $this->postJournal($receipt, $data, $user);

            $receipt->forceFill(['journal_entry_id' => $entry->id])->save();

            foreach ($data->allocations as $allocation) {
                $this->applyToInvoice($invoices[$allocation->salesInvoiceId], $allocation->amount, add: true);
            }

            return $receipt->refresh();
        });
    }

    /**
     * Membatalkan penerimaan.
     *
     * Jurnalnya dibalik, dan piutang invoice yang tadinya berkurang dikembalikan
     * seperti semula. Keduanya harus terjadi bersamaan; karena itu seluruhnya
     * berada dalam satu transaksi database.
     *
     * @throws PaymentReceiptException
     */
    public function cancel(PaymentReceipt $receipt, User $user): PaymentReceipt
    {
        if ($receipt->isCancelled()) {
            throw PaymentReceiptException::alreadyCancelled($receipt->number);
        }

        return DB::transaction(function () use ($receipt, $user) {
            $receipt->loadMissing('allocations.invoice', 'customer', 'cashAccount');

            $original = $receipt->journalEntry()->with('lines.account')->firstOrFail();

            $this->journals->post(new JournalDraft(
                date: $receipt->date,
                description: "Pembatalan {$receipt->number}",
                lines: $this->reversalLines($original),
                createdBy: $user->id,
                source: JournalSource::CashReceipt,
                sourceId: $receipt->id,
                sourceNumber: $receipt->number,
            ));

            foreach ($receipt->allocations as $allocation) {
                $this->applyToInvoice($allocation->invoice, (string) $allocation->amount, add: false);
            }

            $receipt->forceFill(['status' => ReceiptStatus::Cancelled])->save();

            return $receipt->refresh();
        });
    }

    /**
     * Memeriksa seluruh aturan sebelum satu baris pun ditulis.
     *
     * @return array<int, SalesInvoice> invoice yang dilunasi, terindeks id
     *
     * @throws PaymentReceiptException
     */
    private function validate(PaymentReceiptData $data): array
    {
        if ($data->allocations === []) {
            throw PaymentReceiptException::noAllocations();
        }

        $account = Account::query()->findOrFail($data->cashAccountId);

        if (! $account->is_cash) {
            throw PaymentReceiptException::notACashAccount($account->code);
        }

        $invoices = SalesInvoice::query()
            ->whereIn('id', array_map(fn ($row) => $row->salesInvoiceId, $data->allocations))
            ->get()
            ->keyBy('id');

        $resolved = [];

        foreach ($data->allocations as $allocation) {
            $invoice = $invoices->get($allocation->salesInvoiceId);

            if ($invoice === null) {
                throw PaymentReceiptException::notOutstanding("#{$allocation->salesInvoiceId}");
            }

            if (bccomp($allocation->amount, '0', 2) <= 0) {
                throw PaymentReceiptException::nonPositiveAmount($invoice->number);
            }

            if ($invoice->customer_id !== $data->customerId) {
                throw PaymentReceiptException::foreignInvoice($invoice->number);
            }

            if (! $invoice->status->isOutstanding()) {
                throw PaymentReceiptException::notOutstanding($invoice->number);
            }

            $outstanding = $invoice->outstandingAmount();

            if (bccomp($allocation->amount, $outstanding, 2) > 0) {
                throw PaymentReceiptException::exceedsOutstanding($invoice->number, $outstanding);
            }

            $resolved[$invoice->id] = $invoice;
        }

        return $resolved;
    }

    private function store(PaymentReceiptData $data, User $user): PaymentReceipt
    {
        $receipt = new PaymentReceipt;
        $receipt->forceFill([
            'number' => $this->numbers->next(self::PREFIX, $data->date, PaymentReceipt::class),
            'date' => $data->date->toDateString(),
            'customer_id' => $data->customerId,
            'cash_account_id' => $data->cashAccountId,
            'amount' => $data->total(),
            'reference' => $data->reference,
            'note' => $data->note,
            'status' => ReceiptStatus::Posted,
            'created_by' => $user->id,
        ])->save();

        foreach ($data->allocations as $allocation) {
            $receipt->allocations()->save(
                (new PaymentAllocation)->forceFill([
                    'sales_invoice_id' => $allocation->salesInvoiceId,
                    'amount' => $allocation->amount,
                ])
            );
        }

        return $receipt;
    }

    /**
     * Jurnal penerimaan: kas bertambah, piutang berkurang.
     *
     *   Debit   Kas / Bank        total penerimaan
     *   Kredit  Piutang Usaha     total penerimaan
     *
     * Satu baris kredit untuk seluruh invoice, bukan satu baris per invoice —
     * semuanya bermuara ke akun piutang yang sama, dan rincian per invoicenya
     * sudah tercatat pada alokasi.
     */
    private function postJournal(PaymentReceipt $receipt, PaymentReceiptData $data, User $user): JournalEntry
    {
        $receipt->loadMissing('customer', 'cashAccount');
        $party = $receipt->customer->name;

        return $this->journals->post(new JournalDraft(
            date: $receipt->date,
            description: "Penerimaan {$receipt->number} · {$party}",
            lines: [
                JournalLineDraft::debit($receipt->cashAccount->code, $data->total(), "Penerimaan · {$party}"),
                JournalLineDraft::credit(
                    config('triplastindo.accounts.receivable'),
                    $data->total(),
                    "Pelunasan · {$party}",
                ),
            ],
            createdBy: $user->id,
            source: JournalSource::CashReceipt,
            sourceId: $receipt->id,
            sourceNumber: $receipt->number,
            paymentMethod: $receipt->cashAccount->name,
        ));
    }

    /**
     * Menambah atau mengurangi nilai terbayar sebuah invoice.
     *
     * Statusnya ikut disesuaikan, sehingga invoice yang lunas berhenti muncul
     * sebagai piutang terbuka, dan yang penerimaannya dibatalkan kembali
     * terbuka.
     */
    private function applyToInvoice(SalesInvoice $invoice, string $amount, bool $add): void
    {
        $paid = $add
            ? bcadd((string) $invoice->paid_amount, $amount, 2)
            : bcsub((string) $invoice->paid_amount, $amount, 2);

        $invoice->forceFill(['paid_amount' => $paid]);

        // Invoice yang penerimaannya dibatalkan tidak boleh ikut berubah bila
        // dokumennya sendiri sudah dibatalkan.
        if ($invoice->status !== DocumentStatus::Cancelled) {
            $invoice->forceFill(['status' => $invoice->statusForPayment()]);
        }

        $invoice->save();
    }

    /**
     * Baris jurnal pembalik: sisi debit dan kredit ditukar, debit lebih dahulu.
     *
     * @return list<JournalLineDraft>
     */
    private function reversalLines(JournalEntry $entry): array
    {
        $debits = [];
        $credits = [];

        foreach ($entry->lines as $line) {
            if ($line->isDebit()) {
                $credits[] = JournalLineDraft::credit($line->account->code, $line->amount(), $line->description);
            } else {
                $debits[] = JournalLineDraft::debit($line->account->code, $line->amount(), $line->description);
            }
        }

        return [...$debits, ...$credits];
    }
}
