<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * Payroll satu bulan.
 *
 * @property string $number
 * @property int $year
 * @property int $month
 * @property Carbon $payment_date
 * @property string $status
 */
#[Fillable(['number', 'year', 'month', 'payment_date', 'cash_account_id', 'status', 'total_gross', 'total_net', 'total_take_home', 'journal_entry_id', 'created_by', 'note'])]
class PayrollRun extends Model
{
    use SoftDeletes;

    protected function casts(): array
    {
        return [
            'payment_date' => 'date',
            'year' => 'integer',
            'month' => 'integer',
            'total_gross' => 'decimal:2',
            'total_net' => 'decimal:2',
            'total_take_home' => 'decimal:2',
        ];
    }

    /** @return HasMany<PayrollItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(PayrollItem::class);
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

    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }
}
