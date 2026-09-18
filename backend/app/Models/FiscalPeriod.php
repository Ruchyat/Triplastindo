<?php

namespace App\Models;

use App\Enums\PeriodStatus;
use App\Services\Accounting\ClosedPeriodRegistry;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $year
 * @property int $month
 * @property PeriodStatus $status
 */
#[Fillable(['year', 'month', 'status', 'closed_by', 'closed_at'])]
class FiscalPeriod extends Model
{
    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'month' => 'integer',
            'status' => PeriodStatus::class,
            'closed_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function closedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'closed_by');
    }

    public function isClosed(): bool
    {
        return $this->status === PeriodStatus::Closed;
    }

    /**
     * Apakah tanggal ini berada pada bulan yang sudah ditutup.
     *
     * Bulan tanpa baris dianggap terbuka: aplikasi hanya mencatat bulan yang
     * pernah ditutup, bukan seluruh bulan yang mungkin ada.
     *
     * Jawabannya diingat ClosedPeriodRegistry selama satu permintaan, sehingga
     * daftar jurnal tidak menanyakan hal yang sama sekali per baris.
     */
    public static function isClosedOn(CarbonInterface $date): bool
    {
        return app(ClosedPeriodRegistry::class)->isClosed($date);
    }
}
