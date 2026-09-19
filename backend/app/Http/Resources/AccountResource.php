<?php

namespace App\Http\Resources;

use App\Models\Account;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Bentuk akun COA yang dikirim ke frontend.
 *
 * `label` ikut dikirim supaya dropdown dan tabel di seluruh aplikasi menulis
 * akun dengan bentuk yang sama persis, tanpa masing-masing menyusunnya sendiri.
 *
 * @mixin Account
 */
class AccountResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'label' => $this->label(),
            'account_category_id' => $this->account_category_id,
            'category' => new AccountCategoryResource($this->whenLoaded('category')),
            'description' => $this->description,
            'normal_balance' => $this->normal_balance->value,
            'normal_balance_label' => $this->normal_balance->label(),
            'is_cash' => $this->is_cash,
            'is_active' => $this->is_active,
        ];
    }
}
