<?php

namespace App\Models;

use App\Enums\DepositMovement;
use App\Enums\DocumentStatus;
use App\Enums\SettlementMethod;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * Invoice penjualan.
 *
 * Seperti model jurnal, invoice sengaja tidak dapat diisi massal: ia hanya
 * dibuat lewat SalesInvoicePoster, yang menjaga agar total, jurnal, dan status
 * selalu sejalan satu sama lain.
 *
 * @property string $number
 * @property Carbon $date
 * @property SettlementMethod $settlement_method
 * @property DocumentStatus $status
 * @property string $total
 * @property string $paid_amount
 */
class SalesInvoice extends Model
{
    use SoftDeletes;

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'due_date' => 'date',
            'settlement_method' => SettlementMethod::class,
            'use_deposit' => 'boolean',
            'status' => DocumentStatus::class,
            'subtotal' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'total' => 'decimal:2',
            'paid_amount' => 'decimal:2',
            'term_days' => 'integer',
        ];
    }

    /** @return HasMany<SalesInvoiceItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(SalesInvoiceItem::class)->orderBy('sort_order');
    }

    /**
     * Pemakaian deposit customer pada invoice ini.
     *
     * @return HasMany<CustomerDeposit, $this>
     */
    public function depositApplications(): HasMany
    {
        return $this->hasMany(CustomerDeposit::class)->where('movement', DepositMovement::Applied);
    }

    /**
     * Bagian-bagian penerimaan pembayaran yang melunasi invoice ini.
     *
     * @return HasMany<PaymentAllocation, $this>
     */
    public function allocations(): HasMany
    {
        return $this->hasMany(PaymentAllocation::class);
    }

    /** @return BelongsTo<Customer, $this> */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /** @return BelongsTo<Account, $this> */
    public function cashAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'cash_account_id');
    }

    /** @return BelongsTo<JournalEntry, $this> */
    public function journalEntry(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class);
    }

    /** @return BelongsTo<User, $this> */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** Invoice yang masih menyisakan piutang. */
    #[Scope]
    protected function outstanding(Builder $query): void
    {
        $query->whereIn('status', [DocumentStatus::Unpaid->value, DocumentStatus::Partial->value]);
    }

    #[Scope]
    protected function between(Builder $query, string $from, string $to): void
    {
        $query->whereBetween('date', [$from, $to]);
    }

    /** Sisa yang belum dibayar. */
    public function outstandingAmount(): string
    {
        return bcsub((string) $this->total, (string) $this->paid_amount, 2);
    }

    public function isDraft(): bool
    {
        return $this->status === DocumentStatus::Draft;
    }

    public function isPosted(): bool
    {
        return $this->journal_entry_id !== null
            && $this->status !== DocumentStatus::Cancelled;
    }

    /**
     * Apakah invoice ini sudah pernah menerima pembayaran.
     *
     * Invoice yang sudah dilunasi sebagian tidak dapat langsung dibatalkan:
     * membatalkannya akan menyisakan uang yang sudah masuk tanpa dokumen yang
     * menjelaskannya. Penerimaannya harus dibatalkan lebih dahulu.
     */
    public function hasPayments(): bool
    {
        return $this->allocations()
            ->whereHas('receipt', fn ($receipt) => $receipt->posted())
            ->exists();
    }

    /**
     * Status yang ditampilkan kepada pengguna.
     *
     * Jatuh tempo tidak disimpan di database karena ia berubah sendiri seiring
     * waktu tanpa ada yang menyentuh invoicenya. Menyimpannya berarti butuh
     * penjadwal yang memutakhirkan status setiap hari, dan status akan salah
     * setiap kali penjadwal itu tidak jalan.
     */
    public function displayStatus(): DocumentStatus
    {
        if ($this->status->isOutstanding() && $this->due_date?->isPast()) {
            return DocumentStatus::Overdue;
        }

        return $this->status;
    }

    /** Status yang benar setelah nilai pembayaran berubah. */
    public function statusForPayment(): DocumentStatus
    {
        if (bccomp((string) $this->paid_amount, (string) $this->total, 2) >= 0) {
            return DocumentStatus::Paid;
        }

        return bccomp((string) $this->paid_amount, '0', 2) > 0
            ? DocumentStatus::Partial
            : DocumentStatus::Unpaid;
    }
}
