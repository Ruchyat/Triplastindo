<?php

namespace App\Http\Resources;

use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Customer */
class CustomerResource extends JsonResource
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
            'credit_limit' => $this->credit_limit,
            'is_active' => $this->is_active,
            // Dihitung hanya bila diminta; daftar customer yang panjang tidak
            // perlu menjalankan satu agregasi per baris.
            'open_receivable' => $this->when(
                $request->boolean('with_balance'),
                fn () => $this->openReceivable(),
            ),
            'deposit_balance' => $this->when(
                $request->boolean('with_balance'),
                fn () => $this->depositBalance(),
            ),
        ];
    }
}
