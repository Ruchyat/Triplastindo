<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Satu baris item tagihan pembelian.
 *
 * @property string $quantity
 * @property string $unit_price
 * @property string $amount
 */
class PurchaseBillItem extends Model
{
    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:3',
            'unit_price' => 'decimal:2',
            'amount' => 'decimal:2',
        ];
    }

    /** @return BelongsTo<PurchaseBill, $this> */
    public function bill(): BelongsTo
    {
        return $this->belongsTo(PurchaseBill::class, 'purchase_bill_id');
    }

    /** Kosong pada kategori beban, yang barisnya cukup berupa keterangan. */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /** Nama baris: nama produk bila ada, selain itu keterangannya. */
    public function label(): string
    {
        return $this->product?->name ?? ($this->description ?? '–');
    }
}
