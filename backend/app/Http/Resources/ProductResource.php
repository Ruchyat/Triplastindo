<?php

namespace App\Http\Resources;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Product */
class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'category' => $this->category->value,
            'category_label' => $this->category->label(),
            'unit' => $this->unit,
            'revenue_account' => new AccountResource($this->whenLoaded('revenueAccount')),
            'is_active' => $this->is_active,
        ];
    }
}
