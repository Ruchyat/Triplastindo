<?php

namespace App\Services\Purchases;

use App\Enums\PurchaseCategory;
use App\Enums\SettlementMethod;
use Illuminate\Support\Carbon;

/** Isi sebuah tagihan pembelian yang diajukan ke PurchaseBillPoster. */
final readonly class PurchaseBillData
{
    /** @param  list<PurchaseBillItemData>  $items */
    public function __construct(
        public Carbon $date,
        public int $supplierId,
        public PurchaseCategory $category,
        public SettlementMethod $settlementMethod,
        public array $items,
        public ?string $supplierInvoiceNumber = null,
        /** Hanya untuk kategori Lainnya, yang akunnya dipilih sendiri. */
        public ?int $expenseAccountId = null,
        public ?int $cashAccountId = null,
        public ?int $termDays = null,
        public ?Carbon $dueDate = null,
        public string $taxAmount = '0.00',
        public string $downPayment = '0.00',
        public ?string $note = null,
    ) {}

    /** @param  array<string, mixed>  $input */
    public static function fromRequest(array $input): self
    {
        return new self(
            date: Carbon::parse($input['date']),
            supplierId: (int) $input['supplier_id'],
            category: PurchaseCategory::from($input['category']),
            settlementMethod: SettlementMethod::from($input['settlement_method']),
            items: array_map(
                PurchaseBillItemData::fromArray(...),
                array_values($input['items']),
            ),
            supplierInvoiceNumber: $input['supplier_invoice_number'] ?? null,
            expenseAccountId: isset($input['expense_account_id']) ? (int) $input['expense_account_id'] : null,
            cashAccountId: isset($input['cash_account_id']) ? (int) $input['cash_account_id'] : null,
            termDays: isset($input['term_days']) ? (int) $input['term_days'] : null,
            dueDate: isset($input['due_date']) ? Carbon::parse($input['due_date']) : null,
            taxAmount: bcadd((string) ($input['tax_amount'] ?? 0), '0', 2),
            downPayment: bcadd((string) ($input['down_payment'] ?? 0), '0', 2),
            note: $input['note'] ?? null,
        );
    }

    public function subtotal(): string
    {
        return array_reduce(
            $this->items,
            fn (string $total, PurchaseBillItemData $item) => bcadd($total, $item->amount(), 2),
            '0.00',
        );
    }

    public function total(): string
    {
        return bcadd($this->subtotal(), $this->taxAmount, 2);
    }

    public function isDeferred(): bool
    {
        return $this->settlementMethod->isDeferred();
    }

    /** Jatuh tempo, dihitung dari termin bila tidak diisi langsung. */
    public function resolvedDueDate(): ?Carbon
    {
        if (! $this->isDeferred()) {
            return null;
        }

        return $this->dueDate ?? ($this->termDays !== null
            ? $this->date->copy()->addDays($this->termDays)
            : null);
    }
}
