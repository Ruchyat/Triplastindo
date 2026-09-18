<?php

namespace App\Http\Resources;

use App\Models\SupplierPayment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin SupplierPayment */
class SupplierPaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'number' => $this->number,
            'date' => $this->date->toDateString(),
            'supplier' => new SupplierResource($this->whenLoaded('supplier')),
            'cash_account' => new AccountResource($this->whenLoaded('cashAccount')),
            'amount' => (string) $this->amount,
            'reference' => $this->reference,
            'note' => $this->note,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'journal_entry' => new JournalEntryResource($this->whenLoaded('journalEntry')),
            'created_by' => new UserResource($this->whenLoaded('creator')),
            'created_at' => $this->created_at?->toIso8601String(),
            'allocations' => SupplierPaymentAllocationResource::collection($this->whenLoaded('allocations')),
        ];
    }
}
