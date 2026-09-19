<?php

namespace App\Http\Resources;

use App\Models\FixedAsset;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;

/** @mixin FixedAsset */
class FixedAssetResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $asOf = now()->endOfMonth();
        $accumulated = $this->accumulatedDepreciation();

        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'asset_type_id' => $this->asset_type_id,
            'type' => $this->whenLoaded('type', fn () => [
                'id' => $this->type->id,
                'name' => $this->type->name,
                'is_depreciable' => $this->type->is_depreciable,
            ]),
            'acquisition_date' => $this->acquisition_date->toDateString(),
            'in_use_date' => $this->in_use_date->toDateString(),
            'cost' => (string) $this->cost,
            'residual_value' => (string) $this->residual_value,
            'useful_life_months' => $this->useful_life_months,
            'useful_life_years' => intdiv($this->useful_life_months, 12),
            'yearly_depreciation' => $this->yearlyDepreciation(),
            'monthly_depreciation' => $this->monthlyDepreciation(),
            'months_in_use' => $this->monthsInUse(Carbon::instance($asOf)),
            'opening_accumulated' => (string) $this->opening_accumulated,
            'accumulated_depreciation' => $accumulated,
            'book_value' => bcsub((string) $this->cost, $accumulated, 2),
            'status' => $this->status,
            'disposed_at' => $this->disposed_at?->toDateString(),
            'note' => $this->note,
            'depreciations' => $this->whenLoaded('depreciations', fn () => $this->depreciations->map(fn ($row) => [
                'year' => $row->year,
                'month' => $row->month,
                'amount' => (string) $row->amount,
                'journal_entry_id' => $row->journal_entry_id,
            ])),
        ];
    }
}
