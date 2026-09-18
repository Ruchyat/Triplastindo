<?php

namespace App\Http\Resources;

use App\Models\SalesInvoiceItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin SalesInvoiceItem */
class SalesInvoiceItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product' => new ProductResource($this->whenLoaded('product')),
            'quantity' => (string) $this->quantity,
            'unit_price' => (string) $this->unit_price,
            'amount' => (string) $this->amount,
            'description' => $this->description,
        ];
    }
}
