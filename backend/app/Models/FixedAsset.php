<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * Satu aset tetap dengan penyusutan garis lurus.
 *
 * Rumus mengikuti tab ASET & DEPRESIASI: residu = nominal × 1% (bawaan),
 * penyusutan/bulan = (nominal − residu) / umur manfaat bulan.
 *
 * @property string $code
 * @property string $name
 * @property Carbon $acquisition_date
 * @property Carbon $in_use_date
 * @property string $cost
 * @property string $residual_value
 * @property int $useful_life_months
 * @property string $opening_accumulated
 * @property string $status
 */
#[Fillable([
    'code', 'name', 'asset_type_id', 'acquisition_date', 'in_use_date', 'cost',
    'residual_value', 'useful_life_months', 'opening_accumulated', 'status', 'disposed_at',
    'acquisition_journal_id', 'disposal_journal_id', 'note',
])]
class FixedAsset extends Model
{
    use SoftDeletes;

    protected function casts(): array
    {
        return [
            'acquisition_date' => 'date',
            'in_use_date' => 'date',
            'disposed_at' => 'date',
            'cost' => 'decimal:2',
            'residual_value' => 'decimal:2',
            'opening_accumulated' => 'decimal:2',
            'useful_life_months' => 'integer',
        ];
    }

    /** @return BelongsTo<AssetType, $this> */
    public function type(): BelongsTo
    {
        return $this->belongsTo(AssetType::class, 'asset_type_id');
    }

    /** @return HasMany<AssetDepreciation, $this> */
    public function depreciations(): HasMany
    {
        return $this->hasMany(AssetDepreciation::class)->orderBy('year')->orderBy('month');
    }

    /** @return BelongsTo<JournalEntry, $this> */
    public function acquisitionJournal(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class, 'acquisition_journal_id');
    }

    /** Dasar penyusutan: nominal dikurangi nilai residu. */
    public function depreciableBase(): string
    {
        return bcsub((string) $this->cost, (string) $this->residual_value, 2);
    }

    public function monthlyDepreciation(): string
    {
        if ($this->useful_life_months === 0 || ! $this->type->is_depreciable) {
            return '0.00';
        }

        return bcdiv($this->depreciableBase(), (string) $this->useful_life_months, 2);
    }

    public function yearlyDepreciation(): string
    {
        return bcmul($this->monthlyDepreciation(), '12', 2);
    }

    /** Akumulasi yang sudah dijurnal aplikasi ditambah saldo awalnya. */
    public function accumulatedDepreciation(): string
    {
        $posted = (string) ($this->depreciations()->sum('amount') ?? 0);

        return bcadd((string) $this->opening_accumulated, $posted, 2);
    }

    public function bookValue(): string
    {
        return bcsub((string) $this->cost, $this->accumulatedDepreciation(), 2);
    }

    /** Penyusutan yang masih tersisa sampai nilai residu. */
    public function remainingDepreciable(): string
    {
        return bcsub($this->depreciableBase(), $this->accumulatedDepreciation(), 2);
    }

    /** Bulan berjalan sejak dipakai sampai akhir bulan tertentu, dibulatkan ke bawah. */
    public function monthsInUse(Carbon $asOf): int
    {
        if ($this->in_use_date->greaterThan($asOf)) {
            return 0;
        }

        return $this->in_use_date->copy()->startOfMonth()->diffInMonths($asOf->copy()->startOfMonth()) + 1;
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }
}
