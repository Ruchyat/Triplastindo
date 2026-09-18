<?php

namespace App\Services\Purchases;

use App\Exceptions\PurchaseBillException;

/** Satu baris item yang diajukan ke PurchaseBillPoster. */
final readonly class PurchaseBillItemData
{
    public function __construct(
        public string $quantity,
        public string $unitPrice,
        /** Terisi pada kategori persediaan; kosong pada kategori beban. */
        public ?int $productId = null,
        public ?string $description = null,
        public string $unit = 'Kg',
    ) {}

    /** @param  array<string, mixed>  $row */
    public static function fromArray(array $row): self
    {
        return new self(
            quantity: bcadd((string) $row['quantity'], '0', 3),
            unitPrice: bcadd((string) $row['unit_price'], '0', 2),
            productId: isset($row['product_id']) ? (int) $row['product_id'] : null,
            description: $row['description'] ?? null,
            unit: $row['unit'] ?? 'Kg',
        );
    }

    public function amount(): string
    {
        return bcmul($this->quantity, $this->unitPrice, 2);
    }

    /** @throws PurchaseBillException */
    public function assertPositive(): void
    {
        if (bccomp($this->quantity, '0', 3) <= 0 || bccomp($this->unitPrice, '0', 2) <= 0) {
            throw PurchaseBillException::nonPositiveItem();
        }
    }
}
