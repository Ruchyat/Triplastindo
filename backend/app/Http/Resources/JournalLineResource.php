<?php

namespace App\Http\Resources;

use App\Models\JournalLine;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin JournalLine */
class JournalLineResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'account' => new AccountResource($this->whenLoaded('account')),
            'debit' => (string) $this->debit,
            'credit' => (string) $this->credit,
            'description' => $this->description,
        ];
    }
}
