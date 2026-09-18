<?php

namespace App\Http\Resources;

use App\Models\PurchaseBillItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin PurchaseBillItem */
class PurchaseBillItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product' => new ProductResource($this->whenLoaded('product')),
            'description' => $this->description,
            'label' => $this->label(),
            'quantity' => (string) $this->quantity,
            'unit' => $this->unit,
            'unit_price' => (string) $this->unit_price,
            'amount' => (string) $this->amount,
        ];
    }
}
