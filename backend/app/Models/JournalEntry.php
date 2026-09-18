<?php

namespace App\Models;

use App\Enums\JournalSource;
use App\Enums\JournalTagging;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * Kepala jurnal.
 *
 * Model ini sengaja tidak `Fillable`. Jurnal hanya boleh lahir lewat
 * JournalPoster, yang menjamin nomor urut, penandaan kas, dan keseimbangan
 * debit-kredit. Membiarkannya dapat diisi massal berarti membuka jalan
 * membuat jurnal yang tidak balance.
 *
 * @property string $number
 * @property Carbon $date
 * @property string $description
 * @property JournalTagging $tagging
 * @property JournalSource $source
 */
class JournalEntry extends Model
{
    use SoftDeletes;

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'tagging' => JournalTagging::class,
            'source' => JournalSource::class,
        ];
    }

    /** @return HasMany<JournalLine, $this> */
    public function lines(): HasMany
    {
        return $this->hasMany(JournalLine::class)->orderBy('sort_order');
    }

    /** @return BelongsTo<User, $this> */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    #[Scope]
    protected function period(Builder $query, int $year, int $month): void
    {
        $query->whereYear('date', $year)->whereMonth('date', $month);
    }

    #[Scope]
    protected function between(Builder $query, string $from, string $to): void
    {
        $query->whereBetween('date', [$from, $to]);
    }

    public function totalDebit(): string
    {
        return $this->sumOf('debit');
    }

    public function totalCredit(): string
    {
        return $this->sumOf('credit');
    }

    /** Jurnal yang seimbang: total debit sama persis dengan total kredit. */
    public function isBalanced(): bool
    {
        return bccomp($this->totalDebit(), $this->totalCredit(), 2) === 0;
    }

    /**
     * Hanya jurnal manual pada periode terbuka yang boleh disunting.
     *
     * Jurnal turunan dokumen diperbaiki dengan mengubah dokumen asalnya,
     * bukan jurnalnya, supaya dokumen dan jurnal tidak pernah berbeda isi.
     */
    public function isEditable(): bool
    {
        return $this->source->isManual() && ! FiscalPeriod::isClosedOn($this->date);
    }

    private function sumOf(string $column): string
    {
        return $this->lines->reduce(
            fn (string $total, JournalLine $line) => bcadd($total, (string) $line->{$column}, 2),
            '0.00',
        );
    }
}
