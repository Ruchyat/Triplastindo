<?php

namespace App\Services\Payables;

use App\Enums\DocumentStatus;
use App\Enums\JournalSource;
use App\Enums\ReceiptStatus;
use App\Exceptions\SupplierPaymentException;
use App\Models\Account;
use App\Models\JournalEntry;
use App\Models\PurchaseBill;
use App\Models\SupplierPayment;
use App\Models\SupplierPaymentAllocation;
use App\Models\User;
use App\Services\Accounting\JournalDraft;
use App\Services\Accounting\JournalLineDraft;
use App\Services\Accounting\JournalPoster;
use App\Services\DocumentNumberGenerator;
use Illuminate\Support\Facades\DB;

/**
 * Mencatat dan membatalkan pembayaran kepada supplier.
 *
 * Inilah yang menutup siklus akrual pembelian: tagihan membentuk utang,
 * pembayaran menguranginya. Cermin dari PaymentReceiptPoster, dengan satu
 * perbedaan: akun utang yang didebit mengikuti kategori tiap tagihan — utang
 * supplier karung dan utang supplier plastik adalah akun yang berbeda — jadi
 * satu bukti dapat menghasilkan beberapa baris debit.
 */
final class SupplierPaymentPoster
{
    private const PREFIX = 'BKK';

    public function __construct(
        private readonly JournalPoster $journals = new JournalPoster,
        private readonly DocumentNumberGenerator $numbers = new DocumentNumberGenerator,
    ) {}

    /** @throws SupplierPaymentException */
    public function create(SupplierPaymentData $data, User $user): SupplierPayment
    {
        $bills = $this->validate($data);

        return DB::transaction(function () use ($data, $user, $bills) {
            $payment = $this->store($data, $user);
            $entry = $this->postJournal($payment, $data, $bills, $user);

            $payment->forceFill(['journal_entry_id' => $entry->id])->save();

            foreach ($data->allocations as $allocation) {
                $this->applyToBill($bills[$allocation->purchaseBillId], $allocation->amount, add: true);
            }

            return $payment->refresh();
        });
    }

    /**
     * Membatalkan pembayaran: jurnalnya dibalik, utang tagihannya dikembalikan.
     *
     * @throws SupplierPaymentException
     */
    public function cancel(SupplierPayment $payment, User $user): SupplierPayment
    {
        if ($payment->isCancelled()) {
            throw SupplierPaymentException::alreadyCancelled($payment->number);
        }

        return DB::transaction(function () use ($payment, $user) {
            $payment->loadMissing('allocations.bill', 'supplier', 'cashAccount');

            $original = $payment->journalEntry()->with('lines.account')->firstOrFail();

            $this->journals->post(new JournalDraft(
                date: $payment->date,
                description: "Pembatalan {$payment->number}",
                lines: $this->reversalLines($original),
                createdBy: $user->id,
                source: JournalSource::CashPayment,
                sourceId: $payment->id,
                sourceNumber: $payment->number,
            ));

            foreach ($payment->allocations as $allocation) {
                $this->applyToBill($allocation->bill, (string) $allocation->amount, add: false);
            }

            $payment->forceFill(['status' => ReceiptStatus::Cancelled])->save();

            return $payment->refresh();
        });
    }

    /**
     * Memeriksa seluruh aturan sebelum satu baris pun ditulis.
     *
     * @return array<int, PurchaseBill> tagihan yang dibayar, terindeks id
     *
     * @throws SupplierPaymentException
     */
    private function validate(SupplierPaymentData $data): array
    {
        if ($data->allocations === []) {
            throw SupplierPaymentException::noAllocations();
        }

        $account = Account::query()->findOrFail($data->cashAccountId);

        if (! $account->is_cash) {
            throw SupplierPaymentException::notACashAccount($account->code);
        }

        $bills = PurchaseBill::query()
            ->whereIn('id', array_map(fn ($row) => $row->purchaseBillId, $data->allocations))
            ->get()
            ->keyBy('id');

        $resolved = [];

        foreach ($data->allocations as $allocation) {
            $bill = $bills->get($allocation->purchaseBillId);

            if ($bill === null) {
                throw SupplierPaymentException::notOutstanding("#{$allocation->purchaseBillId}");
            }

            if (bccomp($allocation->amount, '0', 2) <= 0) {
                throw SupplierPaymentException::nonPositiveAmount($bill->number);
            }

            if ($bill->supplier_id !== $data->supplierId) {
                throw SupplierPaymentException::foreignBill($bill->number);
            }

            if (! $bill->status->isOutstanding()) {
                throw SupplierPaymentException::notOutstanding($bill->number);
            }

            $outstanding = $bill->outstandingAmount();

            if (bccomp($allocation->amount, $outstanding, 2) > 0) {
                throw SupplierPaymentException::exceedsOutstanding($bill->number, $outstanding);
            }

            $resolved[$bill->id] = $bill;
        }

        return $resolved;
    }

    private function store(SupplierPaymentData $data, User $user): SupplierPayment
    {
        $payment = new SupplierPayment;
        $payment->forceFill([
            'number' => $this->numbers->next(self::PREFIX, $data->date, SupplierPayment::class),
            'date' => $data->date->toDateString(),
            'supplier_id' => $data->supplierId,
            'cash_account_id' => $data->cashAccountId,
            'amount' => $data->total(),
            'reference' => $data->reference,
            'note' => $data->note,
            'status' => ReceiptStatus::Posted,
            'created_by' => $user->id,
        ])->save();

        foreach ($data->allocations as $allocation) {
            $payment->allocations()->save(
                (new SupplierPaymentAllocation)->forceFill([
                    'purchase_bill_id' => $allocation->purchaseBillId,
                    'amount' => $allocation->amount,
                ])
            );
        }

        return $payment;
    }

    /**
     * Jurnal pembayaran: utang berkurang, kas berkurang.
     *
     *   Debit   Utang Supplier …   per akun utang
     *   Kredit  Kas / Bank         total pembayaran
     *
     * Sisi debit dikelompokkan per akun utang, karena kategori tagihan yang
     * berbeda dapat bermuara ke akun utang yang berbeda.
     *
     * @param  array<int, PurchaseBill>  $bills
     */
    private function postJournal(
        SupplierPayment $payment,
        SupplierPaymentData $data,
        array $bills,
        User $user,
    ): JournalEntry {
        $payment->loadMissing('supplier', 'cashAccount');
        $party = $payment->supplier->name;

        $perAccount = [];

        foreach ($data->allocations as $allocation) {
            $code = $bills[$allocation->purchaseBillId]->category->payableAccount();
            $perAccount[$code] = bcadd($perAccount[$code] ?? '0.00', $allocation->amount, 2);
        }

        $debits = [];

        foreach ($perAccount as $code => $amount) {
            $debits[] = JournalLineDraft::debit($code, $amount, "Pelunasan utang · {$party}");
        }

        return $this->journals->post(new JournalDraft(
            date: $payment->date,
            description: "Pembayaran {$payment->number} · {$party}",
            lines: [
                ...$debits,
                JournalLineDraft::credit($payment->cashAccount->code, $data->total(), "Pembayaran · {$party}"),
            ],
            createdBy: $user->id,
            source: JournalSource::CashPayment,
            sourceId: $payment->id,
            sourceNumber: $payment->number,
            paymentMethod: $payment->cashAccount->name,
        ));
    }

    /** Menambah atau mengurangi nilai terbayar sebuah tagihan beserta statusnya. */
    private function applyToBill(PurchaseBill $bill, string $amount, bool $add): void
    {
        $paid = $add
            ? bcadd((string) $bill->paid_amount, $amount, 2)
            : bcsub((string) $bill->paid_amount, $amount, 2);

        $bill->forceFill(['paid_amount' => $paid]);

        if ($bill->status !== DocumentStatus::Cancelled) {
            $bill->forceFill(['status' => $bill->statusForPayment()]);
        }

        $bill->save();
    }

    /** @return list<JournalLineDraft> */
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
