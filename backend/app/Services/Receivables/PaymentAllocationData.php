<?php

namespace App\Services\Receivables;

/** Satu baris pelunasan: invoice mana, dilunasi berapa. */
final readonly class PaymentAllocationData
{
    public function __construct(
        public int $salesInvoiceId,
        public string $amount,
    ) {}

    /** @param  array<string, mixed>  $row */
    public static function fromArray(array $row): self
    {
        return new self(
            salesInvoiceId: (int) $row['sales_invoice_id'],
            amount: bcadd((string) $row['amount'], '0', 2),
        );
    }
}
