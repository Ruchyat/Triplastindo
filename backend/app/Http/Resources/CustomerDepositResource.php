<?php

namespace App\Http\Resources;

use App\Models\CustomerDeposit;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Satu mutasi kartu deposit.
 *
 * `received` dan `applied_or_refunded` memisahkan arah mutasinya, supaya tabel
 * kartu deposit dapat menampilkan kolom masuk dan keluar tanpa menghitung
 * sendiri dari jenisnya.
 *
 * @mixin CustomerDeposit
 */
class CustomerDepositResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $incoming = $this->movement->isIncoming();

        return [
            'id' => $this->id,
            'number' => $this->number,
            'date' => $this->date->toDateString(),
            'customer' => new CustomerResource($this->whenLoaded('customer')),
            'movement' => $this->movement->value,
            'movement_label' => $this->movement->label(),
            'amount' => (string) $this->amount,
            'received' => $incoming ? (string) $this->amount : '0.00',
            'applied_or_refunded' => $incoming ? '0.00' : (string) $this->amount,
            'cash_account' => new AccountResource($this->whenLoaded('cashAccount')),
            'invoice' => new SalesInvoiceResource($this->whenLoaded('invoice')),
            'reference' => $this->reference,
            'note' => $this->note,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'journal_entry' => new JournalEntryResource($this->whenLoaded('journalEntry')),
            'created_by' => new UserResource($this->whenLoaded('creator')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
