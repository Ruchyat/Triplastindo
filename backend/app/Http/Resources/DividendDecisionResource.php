<?php

namespace App\Http\Resources;

use App\Models\DividendAllocation;
use App\Models\DividendDecision;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin DividendDecision */
class DividendDecisionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'number' => $this->number,
            'year' => $this->year,
            'month' => $this->month,
            'decision_date' => $this->decision_date->toDateString(),
            'total_amount' => (string) $this->total_amount,
            'tax_rate' => (float) $this->tax_rate,
            'cash_account' => new AccountResource($this->whenLoaded('cashAccount')),
            'status' => $this->status,
            'cash_balance' => (string) $this->cash_balance,
            'minimum_cash' => (string) $this->minimum_cash,
            'is_safe' => bccomp((string) $this->cash_balance, (string) $this->minimum_cash, 2) >= 0,
            'net_profit' => (string) $this->net_profit,
            'note' => $this->note,
            'journal_entry' => new JournalEntryResource($this->whenLoaded('journalEntry')),
            'proposed_by' => new UserResource($this->whenLoaded('proposer')),
            'approved_by' => new UserResource($this->whenLoaded('approver')),
            'approved_at' => $this->approved_at?->toIso8601String(),
            'allocations' => $this->whenLoaded('allocations', fn () => $this->allocations->map(fn (DividendAllocation $a) => [
                'id' => $a->id,
                'shareholder_id' => $a->shareholder_id,
                'shareholder' => $a->relationLoaded('shareholder') ? $a->shareholder->name : null,
                'shares' => $a->shares,
                'percentage' => (float) $a->percentage,
                'gross' => (string) $a->gross,
                'tax' => (string) $a->tax,
                'net' => (string) $a->net,
            ])),
        ];
    }
}
