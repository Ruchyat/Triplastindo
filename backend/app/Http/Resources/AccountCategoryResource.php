<?php

namespace App\Http\Resources;

use App\Models\AccountCategory;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin AccountCategory */
class AccountCategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'group' => $this->group->value,
            'group_label' => $this->group->label(),
            'statement' => $this->statement()->value,
            'statement_label' => $this->statement()->label(),
            'is_cash' => $this->isCash(),
            'sort_order' => $this->sort_order,
        ];
    }
}
