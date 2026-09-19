<?php

namespace App\Http\Resources;

use App\Models\Employee;
use App\Models\PayrollItem;
use App\Models\PayrollRun;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin PayrollRun */
class PayrollRunResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'number' => $this->number,
            'year' => $this->year,
            'month' => $this->month,
            'payment_date' => $this->payment_date->toDateString(),
            'cash_account' => new AccountResource($this->whenLoaded('cashAccount')),
            'status' => $this->status,
            'total_gross' => (string) $this->total_gross,
            'total_net' => (string) $this->total_net,
            'total_take_home' => (string) $this->total_take_home,
            'note' => $this->note,
            'journal_entry' => new JournalEntryResource($this->whenLoaded('journalEntry')),
            'created_by' => new UserResource($this->whenLoaded('creator')),
            'items_count' => $this->whenCounted('items'),
            'items' => $this->whenLoaded('items', fn () => $this->items->map(fn (PayrollItem $item) => [
                'id' => $item->id,
                'employee_id' => $item->employee_id,
                'employee' => $item->relationLoaded('employee') ? [
                    'id' => $item->employee->id,
                    'nik' => $item->employee->nik,
                    'name' => $item->employee->name,
                    'department' => $item->employee->department,
                    'department_label' => Employee::DEPARTMENTS[$item->employee->department] ?? $item->employee->department,
                    'position' => $item->employee->position,
                    'employment_status' => $item->employee->employment_status,
                ] : null,
                ...collect(PayrollItem::AMOUNT_FIELDS)->mapWithKeys(fn ($f) => [$f => (string) $item->{$f}])->all(),
                'gross' => (string) $item->gross,
                'net' => (string) $item->net,
                'take_home' => (string) $item->take_home,
            ])),
        ];
    }
}
