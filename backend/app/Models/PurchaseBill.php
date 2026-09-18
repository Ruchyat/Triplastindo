<?php

namespace App\Models;

use App\Enums\DocumentStatus;
use App\Enums\PurchaseCategory;
use App\Enums\SettlementMethod;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * Tagihan pembelian.
 *
 * Seperti invoice penjualan, hanya dibuat lewat service — PurchaseBillPoster —
 * yang menjaga agar total, jurnal, dan status selalu sejalan.
 *
 * @property string $number
 * @property Carbon $date
 * @property PurchaseCategory $category
 * @property SettlementMethod $settlement_method
 * @property DocumentStatus $status
 * @property string $total
 * @property string $paid_amount
 */
class PurchaseBill extends Model
{
    use SoftDeletes;

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'due_date' => 'date',
            'category' => PurchaseCategory::class,
            'settlement_method' => SettlementMethod::class,
            'status' => DocumentStatus::class,
            'subtotal' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'total' => 'decimal:2',
            'paid_amount' => 'decimal:2',
            'term_days' => 'integer',
        ];
    }

    /** @return HasMany<PurchaseBillItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(PurchaseBillItem::class)->orderBy('sort_order');
    }

    /** @return BelongsTo<Supplier, $this> */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    /** @return BelongsTo<Account, $this> */
    public function cashAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'cash_account_id');
    }

    /** Akun beban pilihan pengguna; hanya terisi pada kategori Lainnya. */
    public function expenseAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'expense_account_id');
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

    /** Kode akun yang didebit: dari kategori, atau pilihan pengguna. */
    public function debitAccountCode(): ?string
    {
        return $this->category->needsAccountChoice()
            ? $this->expenseAccount?->code
            : $this->category->debitAccount();
    }

    /**
     * Status yang ditampilkan kepada pengguna.
     *
     * Jatuh tempo tidak disimpan; ia berubah sendiri seiring waktu tanpa ada
     * yang menyentuh tagihannya.
     */
    public function displayStatus(): DocumentStatus
    {
        if ($this->status->isOutstanding() && $this->due_date?->isPast()) {
            return DocumentStatus::Overdue;
        }

        return $this->status;
    }

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
