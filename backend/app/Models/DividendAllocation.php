<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Bagian satu pemegang saham dari satu keputusan dividen. */
#[Fillable(['dividend_decision_id', 'shareholder_id', 'shares', 'percentage', 'gross', 'tax', 'net'])]
class DividendAllocation extends Model
{
    protected function casts(): array
    {
        return ['shares' => 'integer', 'percentage' => 'decimal:6', 'gross' => 'decimal:2', 'tax' => 'decimal:2', 'net' => 'decimal:2'];
    }

    /** @return BelongsTo<DividendDecision, $this> */
    public function decision(): BelongsTo
    {
        return $this->belongsTo(DividendDecision::class, 'dividend_decision_id');
    }

    /** @return BelongsTo<Shareholder, $this> */
    public function shareholder(): BelongsTo
    {
        return $this->belongsTo(Shareholder::class);
    }
}
