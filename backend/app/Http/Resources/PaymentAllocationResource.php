<?php

namespace App\Http\Resources;

use App\Models\PaymentAllocation;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin PaymentAllocation */
class PaymentAllocationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'amount' => (string) $this->amount,
            'invoice' => new SalesInvoiceResource($this->whenLoaded('invoice')),
            'receipt' => new PaymentReceiptResource($this->whenLoaded('receipt')),
        ];
    }
}
