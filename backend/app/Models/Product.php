<?php

namespace App\Models;

use App\Enums\ProductCategory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property string $code
 * @property string $name
 * @property ProductCategory $category
 * @property string $unit
 * @property bool $is_active
 */
#[Fillable([
    'code', 'name', 'category', 'unit',
    'revenue_account_id', 'inventory_account_id', 'is_active',
])]
class Product extends Model
{
    protected function casts(): array
    {
        return [
            'category' => ProductCategory::class,
            'is_active' => 'boolean',
        ];
    }

    /** @return BelongsTo<Account, $this> */
    public function revenueAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'revenue_account_id');
    }

    /** @return BelongsTo<Account, $this> */
    public function inventoryAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'inventory_account_id');
    }

    #[Scope]
    protected function active(Builder $query): void
    {
        $query->where('is_active', true);
    }

    /**
     * Akun pendapatan yang dipakai saat produk ini dijual.
     *
     * Produk tanpa pemetaan jatuh ke akun penjualan lain-lain, bukan gagal —
     * invoice tetap dapat dibuat, dan Finance dapat merapikan pemetaannya
     * belakangan tanpa transaksi yang tertahan.
     */
    public function revenueAccountCode(): string
    {
        return $this->revenueAccount?->code
            ?? config('triplastindo.accounts.default_revenue');
    }
}
