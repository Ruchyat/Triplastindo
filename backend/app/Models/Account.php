<?php

namespace App\Models;

use App\Enums\NormalBalance;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Satu akun pada Chart of Accounts.
 *
 * @property string $code
 * @property string $name
 * @property NormalBalance $normal_balance
 * @property bool $is_cash
 * @property bool $is_active
 */
#[Fillable([
    'code', 'name', 'account_category_id', 'normal_balance',
    'is_cash', 'is_active', 'description',
])]
class Account extends Model
{
    protected function casts(): array
    {
        return [
            'normal_balance' => NormalBalance::class,
            'is_cash' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    /** @return BelongsTo<AccountCategory, $this> */
    public function category(): BelongsTo
    {
        return $this->belongsTo(AccountCategory::class, 'account_category_id');
    }

    /** @return HasMany<JournalLine, $this> */
    public function journalLines(): HasMany
    {
        return $this->hasMany(JournalLine::class);
    }

    #[Scope]
    protected function active(Builder $query): void
    {
        $query->where('is_active', true);
    }

    /** Label `1-10001 · Kas`, bentuk yang dipakai dropdown dan laporan. */
    public function label(): string
    {
        return "{$this->code} · {$this->name}";
    }

    /**
     * Akun yang pernah dipakai di jurnal tidak boleh dihapus.
     *
     * Menghapusnya akan memutus jejak transaksi lama; yang benar adalah
     * menonaktifkannya supaya tidak lagi muncul pada form.
     */
    public function isDeletable(): bool
    {
        return ! $this->journalLines()->exists();
    }
}
