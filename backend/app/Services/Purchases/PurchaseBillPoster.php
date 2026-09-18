<?php

namespace App\Services\Purchases;

use App\Enums\DocumentStatus;
use App\Enums\JournalSource;
use App\Enums\SettlementMethod;
use App\Exceptions\PurchaseBillException;
use App\Models\Account;
use App\Models\JournalEntry;
use App\Models\PurchaseBill;
use App\Models\PurchaseBillItem;
use App\Models\User;
use App\Services\Accounting\JournalDraft;
use App\Services\Accounting\JournalLineDraft;
use App\Services\Accounting\JournalPoster;
use App\Services\DocumentNumberGenerator;
use Illuminate\Support\Facades\DB;

/**
 * Membuat, memposting, dan membatalkan tagihan pembelian.
 *
 * Cerminan SalesInvoicePoster, dengan satu perbedaan yang menentukan bentuknya:
 * penjualan selalu bermuara ke akun pendapatan, sedangkan pembelian bisa masuk
 * persediaan atau langsung menjadi beban. Kategorilah yang menentukan akunnya,
 * dan pemetaannya ada di konfigurasi supaya dapat berubah tanpa menyentuh kode.
 */
final class PurchaseBillPoster
{
    private const PREFIX = 'PUR';

    public function __construct(
        private readonly JournalPoster $journals = new JournalPoster,
        private readonly DocumentNumberGenerator $numbers = new DocumentNumberGenerator,
    ) {}

    /** @throws PurchaseBillException */
    public function create(PurchaseBillData $data, User $user, bool $post = true): PurchaseBill
    {
        $this->validate($data);

        return DB::transaction(function () use ($data, $user, $post) {
            $bill = $this->store($data, $user);

            return $post ? $this->post($bill, $user) : $bill;
        });
    }

    /** @throws PurchaseBillException */
    public function post(PurchaseBill $bill, User $user): PurchaseBill
    {
        if ($bill->journal_entry_id !== null) {
            throw PurchaseBillException::alreadyPosted($bill->number);
        }

        return DB::transaction(function () use ($bill, $user) {
            $bill->loadMissing('items.product', 'supplier', 'cashAccount', 'expenseAccount');

            $entry = $this->journals->post(new JournalDraft(
                date: $bill->date,
                description: $this->describe($bill),
                lines: $this->journalLines($bill),
                createdBy: $user->id,
                source: JournalSource::Purchase,
                sourceId: $bill->id,
                sourceNumber: $bill->number,
                paymentMethod: $bill->settlement_method->label(),
            ));

            // Tagihan tunai lunas seketika; yang bertermin baru terbayar
            // sebesar DP-nya.
            $paid = $bill->settlement_method->isDeferred()
                ? (string) $bill->paid_amount
                : (string) $bill->total;

            $bill->forceFill(['journal_entry_id' => $entry->id, 'paid_amount' => $paid]);
            $bill->forceFill(['status' => $bill->statusForPayment()])->save();

            return $bill->refresh();
        });
    }

    /**
     * Membatalkan tagihan yang sudah diposting; jurnalnya dibalik.
     *
     * @throws PurchaseBillException
     */
    public function cancel(PurchaseBill $bill, User $user): PurchaseBill
    {
        if ($bill->status === DocumentStatus::Cancelled) {
            throw PurchaseBillException::alreadyCancelled($bill->number);
        }

        if (! $bill->isPosted()) {
            throw PurchaseBillException::notPosted($bill->number);
        }

        return DB::transaction(function () use ($bill, $user) {
            $original = $bill->journalEntry()->with('lines.account')->firstOrFail();

            $this->journals->post(new JournalDraft(
                date: $bill->date,
                description: "Pembatalan {$bill->number}",
                lines: $this->reversalLines($original),
                createdBy: $user->id,
                source: JournalSource::Purchase,
                sourceId: $bill->id,
                sourceNumber: $bill->number,
                paymentMethod: $bill->settlement_method->label(),
            ));

            $bill->forceFill([
                'status' => DocumentStatus::Cancelled,
                'paid_amount' => '0.00',
            ])->save();

            return $bill->refresh();
        });
    }

    /** @throws PurchaseBillException */
    private function validate(PurchaseBillData $data): void
    {
        if ($data->items === []) {
            throw PurchaseBillException::noItems();
        }

        foreach ($data->items as $item) {
            $item->assertPositive();

            // Kategori persediaan menuntut produk agar kartu stoknya kelak
            // dapat mengikuti; kategori beban cukup keterangannya.
            if ($data->category->isStock() && $item->productId === null) {
                throw PurchaseBillException::itemNeedsProduct($data->category->label());
            }

            if (! $data->category->isStock() && blank($item->description)) {
                throw PurchaseBillException::itemNeedsDescription();
            }
        }

        $this->resolveDebitAccount($data);

        $receivedNow = $data->isDeferred() ? $data->downPayment : $data->total();

        if (bccomp($receivedNow, '0', 2) > 0 && $data->cashAccountId === null) {
            throw PurchaseBillException::cashAccountRequired();
        }

        if ($data->cashAccountId !== null) {
            $account = Account::query()->findOrFail($data->cashAccountId);

            if (! $account->is_cash) {
                throw PurchaseBillException::notACashAccount($account->code);
            }
        }

        if (! $data->isDeferred() && bccomp($data->downPayment, '0', 2) > 0) {
            throw PurchaseBillException::downPaymentOnNonCredit();
        }

        if (bccomp($data->downPayment, $data->total(), 2) > 0) {
            throw PurchaseBillException::downPaymentTooLarge();
        }

        if ($data->isDeferred() && $data->resolvedDueDate() === null) {
            throw PurchaseBillException::dueDateRequired();
        }
    }

    /**
     * Kode akun yang didebit, dari kategori atau dari pilihan pengguna.
     *
     * @throws PurchaseBillException
     */
    private function resolveDebitAccount(PurchaseBillData $data): string
    {
        if ($data->category->needsAccountChoice()) {
            if ($data->expenseAccountId === null) {
                throw PurchaseBillException::accountRequired();
            }

            return Account::query()->findOrFail($data->expenseAccountId)->code;
        }

        return $data->category->debitAccount()
            ?? throw PurchaseBillException::unknownAccount($data->category->label());
    }

    private function store(PurchaseBillData $data, User $user): PurchaseBill
    {
        $bill = new PurchaseBill;
        $bill->forceFill([
            'number' => $this->numbers->next(self::PREFIX, $data->date, PurchaseBill::class),
            'date' => $data->date->toDateString(),
            'supplier_id' => $data->supplierId,
            'supplier_invoice_number' => $data->supplierInvoiceNumber,
            'category' => $data->category,
            'expense_account_id' => $data->category->needsAccountChoice() ? $data->expenseAccountId : null,
            'settlement_method' => $data->settlementMethod,
            'cash_account_id' => $data->cashAccountId,
            'term_days' => $data->isDeferred() ? $data->termDays : null,
            'due_date' => $data->resolvedDueDate()?->toDateString(),
            'subtotal' => $data->subtotal(),
            'tax_amount' => $data->taxAmount,
            'total' => $data->total(),
            'paid_amount' => $data->isDeferred() ? $data->downPayment : '0.00',
            'status' => DocumentStatus::Draft,
            'note' => $data->note,
            'created_by' => $user->id,
        ])->save();

        foreach ($data->items as $index => $item) {
            $bill->items()->save(
                (new PurchaseBillItem)->forceFill([
                    'product_id' => $item->productId,
                    'description' => $item->description,
                    'quantity' => $item->quantity,
                    'unit' => $item->unit,
                    'unit_price' => $item->unitPrice,
                    'amount' => $item->amount(),
                    'sort_order' => $index,
                ])
            );
        }

        return $bill;
    }

    /**
     * Menerjemahkan tagihan menjadi baris jurnal.
     *
     *   Debit   Akun kategori, sebesar subtotal
     *   Debit   PPN Masukan, bila ada
     *   Kredit  Kas / Bank, sebesar uang yang benar-benar dibayar
     *   Kredit  Utang, sebesar sisanya
     *
     * Satu baris debit untuk seluruh item, karena kategorinya berlaku untuk
     * satu tagihan — rincian per item sudah tersimpan pada barisnya.
     *
     * @return list<JournalLineDraft>
     */
    private function journalLines(PurchaseBill $bill): array
    {
        $party = $bill->supplier->name;
        $total = (string) $bill->total;

        $paid = $bill->settlement_method->isDeferred()
            ? (string) $bill->paid_amount
            : $total;

        $debits = [JournalLineDraft::debit(
            $bill->debitAccountCode(),
            (string) $bill->subtotal,
            "{$bill->category->label()} · {$party}",
        )];

        if (bccomp((string) $bill->tax_amount, '0', 2) > 0) {
            $debits[] = JournalLineDraft::debit(
                config('triplastindo.accounts.input_tax'),
                (string) $bill->tax_amount,
                "PPN · {$party}",
            );
        }

        $credits = [];

        if (bccomp($paid, '0', 2) > 0) {
            $credits[] = JournalLineDraft::credit(
                $bill->cashAccount->code,
                $paid,
                ($bill->settlement_method === SettlementMethod::Payable ? 'DP' : 'Pembayaran')." · {$party}",
            );
        }

        $payable = bcsub($total, $paid, 2);

        if (bccomp($payable, '0', 2) > 0) {
            $credits[] = JournalLineDraft::credit(
                $bill->category->payableAccount(),
                $payable,
                "Utang · {$party}",
            );
        }

        // Debit dulu, baru kredit — urutan baku pembacaan jurnal.
        return [...$debits, ...$credits];
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

    private function describe(PurchaseBill $bill): string
    {
        return "Pembelian {$bill->number} · {$bill->supplier->name} · {$bill->category->label()}";
    }
}
