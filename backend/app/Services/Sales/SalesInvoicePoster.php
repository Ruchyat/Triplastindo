<?php

namespace App\Services\Sales;

use App\Enums\DocumentStatus;
use App\Enums\JournalSource;
use App\Enums\SettlementMethod;
use App\Exceptions\SalesInvoiceException;
use App\Models\Account;
use App\Models\CustomerDeposit;
use App\Models\JournalEntry;
use App\Models\SalesInvoice;
use App\Models\SalesInvoiceItem;
use App\Models\User;
use App\Services\Accounting\JournalDraft;
use App\Services\Accounting\JournalLineDraft;
use App\Services\Accounting\JournalPoster;
use App\Services\Deposits\CustomerDepositPoster;
use App\Services\DocumentNumberGenerator;
use Illuminate\Support\Facades\DB;

/**
 * Membuat, memposting, dan membatalkan invoice penjualan.
 *
 * Inilah contoh pertama pola yang akan diikuti seluruh modul transaksi:
 * pengguna mencatat kejadian bisnis, service ini menerjemahkannya menjadi
 * jurnal, lalu menyerahkannya ke JournalPoster. Aturan akuntansi tidak
 * ditulis ulang di sini — yang ditulis di sini adalah aturan penjualan.
 */
final class SalesInvoicePoster
{
    private const PREFIX = 'INV';

    public function __construct(
        private readonly JournalPoster $journals = new JournalPoster,
        private readonly DocumentNumberGenerator $numbers = new DocumentNumberGenerator,
        private readonly CustomerDepositPoster $deposits = new CustomerDepositPoster,
    ) {}

    /**
     * Menyimpan invoice, dan langsung memposting jurnalnya bila diminta.
     *
     * Invoice draft tidak menghasilkan jurnal sama sekali, sehingga angkanya
     * belum muncul di laporan mana pun.
     *
     * @throws SalesInvoiceException
     */
    public function create(SalesInvoiceData $data, User $user, bool $post = true): SalesInvoice
    {
        $this->validate($data);

        return DB::transaction(function () use ($data, $user, $post) {
            $invoice = $this->store($data, $user);

            return $post ? $this->post($invoice, $user) : $invoice;
        });
    }

    /**
     * Membentuk jurnal dari invoice yang masih draft.
     *
     * @throws SalesInvoiceException
     */
    public function post(SalesInvoice $invoice, User $user): SalesInvoice
    {
        if ($invoice->journal_entry_id !== null) {
            throw SalesInvoiceException::alreadyPosted($invoice->number);
        }

        return DB::transaction(function () use ($invoice, $user) {
            $invoice->loadMissing('items.product', 'customer', 'cashAccount');

            // Saldo deposit dipotong lebih dulu bila pencatat memilihnya,
            // sebelum sisanya diterima tunai atau menjadi piutang.
            $appliedDeposit = $this->depositFor(
                $invoice->customer_id,
                $invoice->use_deposit,
                (string) $invoice->total,
                (string) $invoice->paid_amount,
            );

            $entry = $this->journals->post(new JournalDraft(
                date: $invoice->date,
                description: $this->describe($invoice),
                lines: $this->journalLines($invoice, $appliedDeposit),
                createdBy: $user->id,
                source: JournalSource::Sale,
                sourceId: $invoice->id,
                sourceNumber: $invoice->number,
                paymentMethod: $invoice->settlement_method->label(),
            ));

            $paid = $invoice->settlement_method->isDeferred()
                ? bcadd((string) $invoice->paid_amount, $appliedDeposit, 2)
                : (string) $invoice->total;

            // paid_amount diisi lebih dulu karena status disimpulkan darinya.
            $invoice->forceFill(['journal_entry_id' => $entry->id, 'paid_amount' => $paid]);
            $invoice->forceFill(['status' => $invoice->statusForPayment()])->save();

            if (bccomp($appliedDeposit, '0', 2) > 0) {
                $this->deposits->recordApplication($invoice, $appliedDeposit, $user);
            }

            return $invoice->refresh();
        });
    }

    /**
     * Membatalkan invoice yang sudah diposting.
     *
     * Jurnalnya dibalik, bukan dihapus. Pembukuan yang sudah dibaca orang lain
     * tidak boleh berubah diam-diam; yang benar adalah mencatat pembalikannya
     * sebagai kejadian tersendiri.
     *
     * @throws SalesInvoiceException
     */
    public function cancel(SalesInvoice $invoice, User $user): SalesInvoice
    {
        if ($invoice->status === DocumentStatus::Cancelled) {
            throw SalesInvoiceException::alreadyCancelled($invoice->number);
        }

        if (! $invoice->isPosted()) {
            throw SalesInvoiceException::notPosted($invoice->number);
        }

        if ($invoice->hasPayments()) {
            throw SalesInvoiceException::hasPayments($invoice->number);
        }

        return DB::transaction(function () use ($invoice, $user) {
            $original = $invoice->journalEntry()->with('lines.account')->firstOrFail();

            $this->journals->post(new JournalDraft(
                date: $invoice->date,
                description: "Pembatalan {$invoice->number}",
                lines: $this->reversalLines($original),
                createdBy: $user->id,
                source: JournalSource::Sale,
                sourceId: $invoice->id,
                sourceNumber: $invoice->number,
                paymentMethod: $invoice->settlement_method->label(),
            ));

            // Deposit yang terpakai pada invoice ini kembali tersedia.
            // Jurnalnya sudah ikut terbalik oleh jurnal pembatalan di atas.
            $this->deposits->releaseApplications($invoice);

            $invoice->forceFill([
                'status' => DocumentStatus::Cancelled,
                'paid_amount' => '0.00',
            ])->save();

            return $invoice->refresh();
        });
    }

    /** @throws SalesInvoiceException */
    private function validate(SalesInvoiceData $data): void
    {
        if ($data->items === []) {
            throw SalesInvoiceException::noItems();
        }

        foreach ($data->items as $item) {
            $item->assertPositive();
        }

        // Akun penerima hanya wajib bila memang ada uang yang masuk. Invoice
        // tunai yang seluruhnya tertutup saldo deposit tidak memindahkan uang
        // sama sekali, jadi tidak perlu menunjuk rekening mana pun.
        $plannedDeposit = $this->depositFor(
            $data->customerId,
            $data->useDeposit,
            $data->total(),
            $data->isDeferred() ? $data->downPayment : '0.00',
        );

        $receivedNow = $data->isDeferred()
            ? $data->downPayment
            : bcsub($data->total(), $plannedDeposit, 2);

        if (bccomp($receivedNow, '0', 2) > 0 && $data->cashAccountId === null) {
            throw SalesInvoiceException::cashAccountRequired();
        }

        if ($data->cashAccountId !== null) {
            $account = Account::query()->findOrFail($data->cashAccountId);

            if (! $account->is_cash) {
                throw SalesInvoiceException::notACashAccount($account->code);
            }
        }

        if (! $data->isDeferred() && bccomp($data->downPayment, '0', 2) > 0) {
            throw SalesInvoiceException::downPaymentOnNonCredit();
        }

        if (bccomp($data->downPayment, $data->total(), 2) > 0) {
            throw SalesInvoiceException::downPaymentTooLarge();
        }

        if ($data->isDeferred() && $data->resolvedDueDate() === null) {
            throw SalesInvoiceException::dueDateRequired();
        }
    }

    private function store(SalesInvoiceData $data, User $user): SalesInvoice
    {
        $invoice = new SalesInvoice;
        $invoice->forceFill([
            'number' => $this->numbers->next(self::PREFIX, $data->date, SalesInvoice::class),
            'date' => $data->date->toDateString(),
            'customer_id' => $data->customerId,
            'settlement_method' => $data->settlementMethod,
            // Disimpan apa adanya; kosong berarti tidak ada uang yang masuk.
            'cash_account_id' => $data->cashAccountId,
            'term_days' => $data->isDeferred() ? $data->termDays : null,
            'due_date' => $data->resolvedDueDate()?->toDateString(),
            'subtotal' => $data->subtotal(),
            'tax_amount' => $data->taxAmount,
            'total' => $data->total(),
            'use_deposit' => $data->useDeposit,
            'paid_amount' => $data->isDeferred() ? $data->downPayment : '0.00',
            'status' => DocumentStatus::Draft,
            'note' => $data->note,
            'created_by' => $user->id,
        ])->save();

        foreach ($data->items as $index => $item) {
            $invoice->items()->save(
                (new SalesInvoiceItem)->forceFill([
                    'product_id' => $item->productId,
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unitPrice,
                    'amount' => $item->amount(),
                    'description' => $item->description,
                    'sort_order' => $index,
                ])
            );
        }

        return $invoice;
    }

    /**
     * Menerjemahkan invoice menjadi baris jurnal.
     *
     *   Debit   Kas / Bank, sebesar uang yang benar-benar diterima
     *   Debit   Deposit Pelanggan, sebesar saldo deposit yang terpakai
     *   Debit   Piutang Usaha, sebesar sisanya
     *   Kredit  Pendapatan, satu baris per akun pendapatan
     *   Kredit  PPN Keluaran, bila ada
     *
     * @return list<JournalLineDraft>
     */
    private function journalLines(SalesInvoice $invoice, string $appliedDeposit = '0.00'): array
    {
        $debits = [];
        $credits = [];

        $total = (string) $invoice->total;

        // Uang yang benar-benar masuk: DP pada penjualan bertermin, atau sisa
        // setelah deposit pada penjualan tunai. Bisa nol bila saldo deposit
        // menutup seluruh invoice — dan ketika itu memang tidak ada baris kas
        // sama sekali, yang justru menggambarkan kenyataannya.
        $received = $invoice->settlement_method->isDeferred()
            ? (string) $invoice->paid_amount
            : bcsub($total, $appliedDeposit, 2);

        // Keterangan baris berpola `<jenis> · <pihak>`. Nomor dokumen tidak
        // ikut karena sudah menjadi kolom tersendiri di Jurnal Umum, sementara
        // nama pihak membuat tiap baris tetap dapat dibaca berdiri sendiri.
        $party = $invoice->customer->name;

        if (bccomp($received, '0', 2) > 0) {
            $debits[] = JournalLineDraft::debit(
                $invoice->cashAccount->code,
                $received,
                ($invoice->settlement_method === SettlementMethod::Receivable ? 'DP' : 'Penerimaan')." · {$party}",
            );
        }

        if (bccomp($appliedDeposit, '0', 2) > 0) {
            $debits[] = JournalLineDraft::debit(
                config('triplastindo.accounts.customer_deposit'),
                $appliedDeposit,
                "Pemakaian deposit · {$party}",
            );
        }

        $receivable = bcsub(bcsub($total, $received, 2), $appliedDeposit, 2);

        if (bccomp($receivable, '0', 2) > 0) {
            $debits[] = JournalLineDraft::debit(
                config('triplastindo.accounts.receivable'),
                $receivable,
                "Piutang · {$party}",
            );
        }

        // Dua produk yang bermuara ke akun pendapatan yang sama digabung
        // menjadi satu baris; rinciannya sudah ada pada item invoice.
        foreach ($this->revenueByAccount($invoice) as $code => $amount) {
            $credits[] = JournalLineDraft::credit($code, $amount, "Penjualan · {$party}");
        }

        if (bccomp((string) $invoice->tax_amount, '0', 2) > 0) {
            $credits[] = JournalLineDraft::credit(
                config('triplastindo.accounts.output_tax'),
                (string) $invoice->tax_amount,
                "PPN · {$party}",
            );
        }

        // Debit dulu, baru kredit — urutan baku pembacaan jurnal.
        return [...$debits, ...$credits];
    }

    /**
     * Berapa saldo deposit customer yang dipotong pada invoice ini.
     *
     * Berlaku untuk kedua metode. Pada penjualan tunai, deposit mengurangi
     * uang yang perlu diterima — sampai nol sama sekali bila saldonya menutup
     * seluruh invoice. Pada penjualan bertermin, ia mengurangi piutang yang
     * terbentuk.
     *
     * Nilainya paling banyak sebesar sisa yang belum tertutup, dan tidak
     * pernah melebihi saldo yang tersedia.
     */
    private function depositFor(int $customerId, bool $useDeposit, string $total, string $alreadyPaid): string
    {
        if (! $useDeposit) {
            return '0.00';
        }

        $remaining = bcsub($total, $alreadyPaid, 2);

        if (bccomp($remaining, '0', 2) <= 0) {
            return '0.00';
        }

        $balance = CustomerDeposit::balanceOf($customerId);

        return bccomp($balance, $remaining, 2) >= 0 ? $remaining : $balance;
    }

    /**
     * Nilai penjualan per akun pendapatan.
     *
     * @return array<string, string>
     */
    private function revenueByAccount(SalesInvoice $invoice): array
    {
        $revenue = [];

        foreach ($invoice->items as $item) {
            $code = $item->product->revenueAccountCode();
            $revenue[$code] = bcadd($revenue[$code] ?? '0.00', (string) $item->amount, 2);
        }

        return $revenue;
    }

    /**
     * Baris jurnal pembalik: sisi debit dan kredit ditukar.
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

    private function describe(SalesInvoice $invoice): string
    {
        $products = $invoice->items
            ->map(fn (SalesInvoiceItem $item) => $item->product->name)
            ->unique()
            ->implode(', ');

        return "Penjualan {$invoice->number} · {$invoice->customer->name} · {$products}";
    }
}
