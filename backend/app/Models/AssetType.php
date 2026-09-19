<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Jenis aset beserta pemetaan tiga akunnya: aset, akumulasi, dan beban
 * penyusutan. Tanah tidak disusutkan.
 *
 * @property string $name
 * @property int $default_useful_life_years
 * @property bool $is_depreciable
 */
#[Fillable([
    'name', 'default_useful_life_years', 'is_depreciable',
    'asset_account_id', 'accumulated_account_id', 'expense_account_id', 'sort_order',
])]
class AssetType extends Model
{
    protected function casts(): array
    {
        return ['is_depreciable' => 'boolean', 'default_useful_life_years' => 'integer'];
    }

    /** @return BelongsTo<Account, $this> */
    public function assetAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'asset_account_id');
    }

    /** @return BelongsTo<Account, $this> */
    public function accumulatedAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'accumulated_account_id');
    }

    /** @return BelongsTo<Account, $this> */
    public function expenseAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'expense_account_id');
    }

    /** @return HasMany<FixedAsset, $this> */
    public function assets(): HasMany
    {
        return $this->hasMany(FixedAsset::class);
    }
}
