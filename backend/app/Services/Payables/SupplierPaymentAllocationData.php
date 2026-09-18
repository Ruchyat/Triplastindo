<?php

namespace App\Services\Payables;

/** Satu baris pembayaran: tagihan mana, dibayar berapa. */
final readonly class SupplierPaymentAllocationData
{
    public function __construct(
        public int $purchaseBillId,
        public string $amount,
    ) {}

    /** @param  array<string, mixed>  $row */
    public static function fromArray(array $row): self
    {
        return new self(
            purchaseBillId: (int) $row['purchase_bill_id'],
            amount: bcadd((string) $row['amount'], '0', 2),
        );
    }
}
