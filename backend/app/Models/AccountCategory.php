<?php

namespace App\Models;

use App\Enums\AccountGroup;
use App\Enums\FinancialStatement;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property string $name
 * @property AccountGroup $group
 * @property int $sort_order
 */
#[Fillable(['name', 'group', 'sort_order'])]
class AccountCategory extends Model
{
    /** Kategori yang saldonya dihitung sebagai kas pada Laporan Arus Kas. */
    public const CASH = 'Kas & Bank';

    protected function casts(): array
    {
        return [
            'group' => AccountGroup::class,
            'sort_order' => 'integer',
        ];
    }

    /** @return HasMany<Account, $this> */
    public function accounts(): HasMany
    {
        return $this->hasMany(Account::class);
    }

    public function statement(): FinancialStatement
    {
        return $this->group->statement();
    }

    public function isCash(): bool
    {
        return $this->name === self::CASH;
    }
}
