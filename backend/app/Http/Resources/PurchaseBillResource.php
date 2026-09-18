<?php

namespace App\Http\Resources;

use App\Models\PurchaseBill;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin PurchaseBill */
class PurchaseBillResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'number' => $this->number,
            'date' => $this->date->toDateString(),
            'supplier' => new SupplierResource($this->whenLoaded('supplier')),
            'supplier_invoice_number' => $this->supplier_invoice_number,

            'category' => $this->category->value,
            'category_label' => $this->category->label(),
            'is_stock_category' => $this->category->isStock(),
            // Akun yang didebit, dari kategori atau dari pilihan pengguna.
            'debit_account_code' => $this->debitAccountCode(),
            'expense_account' => new AccountResource($this->whenLoaded('expenseAccount')),

            'settlement_method' => $this->settlement_method->value,
            'settlement_method_label' => $this->settlement_method->label(),
            'cash_account' => new AccountResource($this->whenLoaded('cashAccount')),
            'term_days' => $this->term_days,
            'due_date' => $this->due_date?->toDateString(),

            'subtotal' => (string) $this->subtotal,
            'tax_amount' => (string) $this->tax_amount,
            'total' => (string) $this->total,
            'paid_amount' => (string) $this->paid_amount,
            'outstanding_amount' => $this->outstandingAmount(),

            'status' => $this->status->value,
            'display_status' => $this->displayStatus()->value,
            'display_status_label' => $this->displayStatus()->label(),

            'is_posted' => $this->isPosted(),
            'journal_entry' => new JournalEntryResource($this->whenLoaded('journalEntry')),
            'note' => $this->note,
            'created_by' => new UserResource($this->whenLoaded('creator')),
            'created_at' => $this->created_at?->toIso8601String(),
            'items' => PurchaseBillItemResource::collection($this->whenLoaded('items')),
        ];
    }
}
