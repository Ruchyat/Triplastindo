<?php

namespace App\Http\Resources;

use App\Models\SupplierPaymentAllocation;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin SupplierPaymentAllocation */
class SupplierPaymentAllocationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'amount' => (string) $this->amount,
            'bill' => new PurchaseBillResource($this->whenLoaded('bill')),
            'payment' => new SupplierPaymentResource($this->whenLoaded('payment')),
        ];
    }
}
