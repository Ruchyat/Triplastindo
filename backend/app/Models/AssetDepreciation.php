<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Penyusutan satu aset pada satu bulan.
 *
 * @property int $year
 * @property int $month
 * @property string $amount
 */
#[Fillable(['fixed_asset_id', 'year', 'month', 'amount', 'journal_entry_id'])]
class AssetDepreciation extends Model
{
    protected function casts(): array
    {
        return ['amount' => 'decimal:2', 'year' => 'integer', 'month' => 'integer'];
    }

    /** @return BelongsTo<FixedAsset, $this> */
    public function asset(): BelongsTo
    {
        return $this->belongsTo(FixedAsset::class, 'fixed_asset_id');
    }

    /** @return BelongsTo<JournalEntry, $this> */
    public function journalEntry(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class);
    }
}
