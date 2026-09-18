<?php

namespace App\Services\Sales;

use App\Exceptions\SalesInvoiceException;

/** Satu baris produk yang diajukan ke SalesInvoicePoster. */
final readonly class SalesInvoiceItemData
{
    public function __construct(
        public int $productId,
        /** Kuantitas dalam satuan produk, tiga desimal. */
        public string $quantity,
        public string $unitPrice,
        public ?string $description = null,
    ) {}

    /** @param  array<string, mixed>  $row */
    public static function fromArray(array $row): self
    {
        return new self(
            productId: (int) $row['product_id'],
            quantity: bcadd((string) $row['quantity'], '0', 3),
            unitPrice: bcadd((string) $row['unit_price'], '0', 2),
            description: $row['description'] ?? null,
        );
    }

    public function amount(): string
    {
        return bcmul($this->quantity, $this->unitPrice, 2);
    }

    /** @throws SalesInvoiceException */
    public function assertPositive(): void
    {
        if (bccomp($this->quantity, '0', 3) <= 0 || bccomp($this->unitPrice, '0', 2) <= 0) {
            throw SalesInvoiceException::nonPositiveItem();
        }
    }
}
