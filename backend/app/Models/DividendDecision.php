<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * Keputusan pembagian dividen satu periode.
 *
 * @property string $number
 * @property int $year
 * @property int $month
 * @property Carbon $decision_date
 * @property string $total_amount
 * @property string $tax_rate
 * @property string $status
 */
#[Fillable([
    'number', 'year', 'month', 'decision_date', 'total_amount', 'tax_rate', 'cash_account_id', 'status',
    'cash_balance', 'minimum_cash', 'net_profit', 'journal_entry_id', 'proposed_by', 'approved_by', 'approved_at', 'note',
])]
class DividendDecision extends Model
{
    use SoftDeletes;

    protected function casts(): array
    {
        return [
            'decision_date' => 'date',
            'approved_at' => 'datetime',
            'year' => 'integer',
            'month' => 'integer',
            'total_amount' => 'decimal:2',
            'tax_rate' => 'decimal:4',
            'cash_balance' => 'decimal:2',
            'minimum_cash' => 'decimal:2',
            'net_profit' => 'decimal:2',
        ];
    }

    /** @return HasMany<DividendAllocation, $this> */
    public function allocations(): HasMany
    {
        return $this->hasMany(DividendAllocation::class);
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
    public function proposer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'proposed_by');
    }

    /** @return BelongsTo<User, $this> */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
