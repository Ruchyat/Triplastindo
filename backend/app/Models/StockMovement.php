<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Satu baris kartu stok (Kg).
 *
 * @property Carbon $date
 * @property string $type
 * @property string $direction
 * @property string $quantity
 * @property string $unit_cost
 * @property string $amount
 */
#[Fillable([
    'date', 'product_id', 'type', 'direction', 'quantity', 'unit_cost', 'amount',
    'source_type', 'source_id', 'source_number', 'journal_entry_id', 'description', 'created_by',
])]
class StockMovement extends Model
{
    public const TYPES = [
        'opening' => 'Saldo Awal',
        'purchase' => 'Pembelian',
        'production_in' => 'Hasil Produksi',
        'consumption' => 'Pemakaian Produksi',
        'sale' => 'Penjualan',
        'adjustment' => 'Penyesuaian',
    ];

    protected function casts(): array
    {
        return ['date' => 'date', 'quantity' => 'decimal:3', 'unit_cost' => 'decimal:2', 'amount' => 'decimal:2'];
    }

    /** @return BelongsTo<Product, $this> */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /** @return BelongsTo<JournalEntry, $this> */
    public function journalEntry(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class);
    }
}
