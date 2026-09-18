<?php

namespace App\Http\Resources;

use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Supplier */
class SupplierResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'contact_name' => $this->contact_name,
            'phone' => $this->phone,
            'email' => $this->email,
            'address' => $this->address,
            'payment_term_days' => $this->payment_term_days,
            'is_active' => $this->is_active,
            'open_payable' => $this->when(
                $request->boolean('with_balance'),
                fn () => $this->openPayable(),
            ),
        ];
    }
}
