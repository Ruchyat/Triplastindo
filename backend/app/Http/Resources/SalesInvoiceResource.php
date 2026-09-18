<?php

namespace App\Http\Resources;

use App\Models\SalesInvoice;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin SalesInvoice */
class SalesInvoiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'number' => $this->number,
            'date' => $this->date->toDateString(),
            'customer' => new CustomerResource($this->whenLoaded('customer')),
            'settlement_method' => $this->settlement_method->value,
            'settlement_method_label' => $this->settlement_method->label(),
            'use_deposit' => $this->use_deposit,
            'cash_account' => new AccountResource($this->whenLoaded('cashAccount')),
            'term_days' => $this->term_days,
            'due_date' => $this->due_date?->toDateString(),

            'subtotal' => (string) $this->subtotal,
            'tax_amount' => (string) $this->tax_amount,
            'total' => (string) $this->total,
            'paid_amount' => (string) $this->paid_amount,
            'outstanding_amount' => $this->outstandingAmount(),

            // `status` adalah nilai yang tersimpan, `display_status` adalah
            // yang dilihat pengguna — keduanya berbeda ketika invoice lewat
            // jatuh tempo, karena jatuh tempo tidak pernah disimpan.
            'status' => $this->status->value,
            'display_status' => $this->displayStatus()->value,
            'display_status_label' => $this->displayStatus()->label(),

            'is_posted' => $this->isPosted(),
            'journal_entry' => new JournalEntryResource($this->whenLoaded('journalEntry')),
            'note' => $this->note,
            'created_by' => new UserResource($this->whenLoaded('creator')),
            'created_at' => $this->created_at?->toIso8601String(),
            'items' => SalesInvoiceItemResource::collection($this->whenLoaded('items')),
            // Riwayat pelunasan invoice ini, satu baris per bukti penerimaan.
            'allocations' => PaymentAllocationResource::collection($this->whenLoaded('allocations')),
            // Deposit customer yang dipotong saat invoice ini diposting.
            'deposit_applications' => CustomerDepositResource::collection(
                $this->whenLoaded('depositApplications')
            ),
        ];
    }
}
