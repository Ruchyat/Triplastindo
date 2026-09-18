<?php

namespace App\Http\Resources;

use App\Models\JournalEntry;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Bentuk jurnal yang dikirim ke frontend.
 *
 * Nilai uang dikirim sebagai string dua desimal. JSON.parse di JavaScript
 * mengubah angka menjadi double, dan nilai rupiah yang besar dapat kehilangan
 * ketepatan di sana.
 *
 * @mixin JournalEntry
 */
class JournalEntryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'number' => $this->number,
            'date' => $this->date->toDateString(),
            'description' => $this->description,
            'tagging' => $this->tagging->value,
            'tagging_label' => $this->tagging->label(),
            'source' => $this->source->value,
            'source_label' => $this->source->label(),
            'source_id' => $this->source_id,
            'source_number' => $this->source_number,
            'payment_method' => $this->payment_method,
            'total_debit' => $this->whenLoaded('lines', fn () => $this->totalDebit()),
            'total_credit' => $this->whenLoaded('lines', fn () => $this->totalCredit()),
            'is_editable' => $this->isEditable(),
            'created_by' => new UserResource($this->whenLoaded('creator')),
            'created_at' => $this->created_at?->toIso8601String(),
            'lines' => JournalLineResource::collection($this->whenLoaded('lines')),
        ];
    }
}
