<?php

namespace App\Services\Inventory;

use App\Enums\JournalSource;
use App\Models\Product;
use App\Models\PurchaseBill;
use App\Models\SalesInvoice;
use App\Models\StockMovement;
use App\Models\User;
use App\Services\Accounting\JournalDraft;
use App\Services\Accounting\JournalLineDraft;
use App\Services\Accounting\JournalPoster;
use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Kartu stok dalam Kg untuk seluruh produk.
 *
 * Pembelian persediaan dan penjualan mengisinya otomatis saat dokumennya
 * diposting, dan menghapusnya saat dibatalkan. Produksi diinput di modul
 * Inventory: pemakaian bahan mengurangi stok bahan sekaligus memindahkan
 * nilainya ke HPP pemakaian (D 5-1000x · K persediaan), hasil produksi
 * menambah stok WIP/barang jadi tanpa jurnal — nilainya dihitung dari HPP/kg
 * pada laporan, mengikuti cara sheet.
 *
 * Harga pokok keluar memakai rata-rata bergerak dari seluruh baris masuk
 * sampai tanggal itu.
 */
final class StockLedger
{
    public function __construct(private readonly JournalPoster $journals = new JournalPoster) {}

    public function recordPurchase(PurchaseBill $bill): void
    {
        if (! $bill->category->isStock()) {
            return;
        }

        $bill->loadMissing('items.product');

        foreach ($bill->items as $item) {
            if ($item->product === null) {
                continue;
            }
            StockMovement::query()->create([
                'date' => $bill->date->toDateString(),
                'product_id' => $item->product_id,
                'type' => 'purchase',
                'direction' => 'in',
                'quantity' => (string) $item->quantity,
                'unit_cost' => (string) $item->unit_price,
                'amount' => (string) $item->amount,
                'source_type' => 'purchase_bill',
                'source_id' => $bill->id,
                'source_number' => $bill->number,
                'description' => "Pembelian {$bill->number}",
                'created_by' => $bill->created_by,
            ]);
        }
    }

    public function recordSale(SalesInvoice $invoice): void
    {
        $invoice->loadMissing('items.product');

        foreach ($invoice->items as $item) {
            if ($item->product === null) {
                continue;
            }
            $cost = $this->averageCost($item->product_id, $invoice->date);
            StockMovement::query()->create([
                'date' => $invoice->date->toDateString(),
                'product_id' => $item->product_id,
                'type' => 'sale',
                'direction' => 'out',
                'quantity' => (string) $item->quantity,
                'unit_cost' => $cost,
                'amount' => bcmul($cost, (string) $item->quantity, 2),
                'source_type' => 'sales_invoice',
                'source_id' => $invoice->id,
                'source_number' => $invoice->number,
                'description' => "Penjualan {$invoice->number}",
                'created_by' => $invoice->created_by,
            ]);
        }
    }

    public function forget(string $sourceType, int $sourceId): void
    {
        StockMovement::query()->where('source_type', $sourceType)->where('source_id', $sourceId)->delete();
    }

    /**
     * Pemakaian bahan untuk produksi: stok bahan berkurang, nilainya (rata-rata
     * bergerak) masuk HPP pemakaian.
     */
    public function consume(Product $product, Carbon $date, string $quantity, ?string $description, User $user): StockMovement
    {
        $product->loadMissing('inventoryAccount');

        if ($product->inventoryAccount === null) {
            throw ValidationException::withMessages(['product_id' => "Produk {$product->name} belum punya akun persediaan."]);
        }

        $usageCode = config("triplastindo.material_usage.{$product->inventoryAccount->code}");
        if ($usageCode === null) {
            throw ValidationException::withMessages(['product_id' => "Akun persediaan {$product->inventoryAccount->code} belum dipetakan ke akun pemakaian."]);
        }

        $balance = $this->balance($product->id, $date);
        if (bccomp($quantity, $balance, 3) > 0) {
            throw ValidationException::withMessages(['quantity' => "Stok {$product->name} per tanggal itu hanya ".number_format((float) $balance, 0, ',', '.').' Kg.']);
        }

        return DB::transaction(function () use ($product, $date, $quantity, $description, $user, $usageCode) {
            $cost = $this->averageCost($product->id, $date);
            $amount = bcmul($cost, $quantity, 2);
            $label = $description ?: "Pemakaian {$product->name}";

            $entry = null;
            if (bccomp($amount, '0', 2) > 0) {
                $entry = $this->journals->post(new JournalDraft(
                    date: $date,
                    description: "Pemakaian bahan · {$label}",
                    lines: [
                        JournalLineDraft::debit($usageCode, $amount, $label),
                        JournalLineDraft::credit($product->inventoryAccount->code, $amount, $label),
                    ],
                    createdBy: $user->id,
                    source: JournalSource::Manual,
                ));
            }

            return StockMovement::query()->create([
                'date' => $date->toDateString(),
                'product_id' => $product->id,
                'type' => 'consumption',
                'direction' => 'out',
                'quantity' => $quantity,
                'unit_cost' => $cost,
                'amount' => $amount,
                'journal_entry_id' => $entry?->id,
                'description' => $label,
                'created_by' => $user->id,
            ]);
        });
    }

    /** Hasil produksi masuk stok tanpa jurnal; nilainya dihitung pada laporan. */
    public function produce(Product $product, Carbon $date, string $quantity, ?string $description, User $user): StockMovement
    {
        return StockMovement::query()->create([
            'date' => $date->toDateString(),
            'product_id' => $product->id,
            'type' => 'production_in',
            'direction' => 'in',
            'quantity' => $quantity,
            'unit_cost' => '0.00',
            'amount' => '0.00',
            'description' => $description ?: "Hasil produksi {$product->name}",
            'created_by' => $user->id,
        ]);
    }

    /** Penyesuaian atau saldo awal stok, tanpa jurnal. */
    public function adjust(Product $product, Carbon $date, string $direction, string $quantity, string $unitCost, ?string $description, User $user, string $type = 'adjustment'): StockMovement
    {
        return StockMovement::query()->create([
            'date' => $date->toDateString(),
            'product_id' => $product->id,
            'type' => $type,
            'direction' => $direction,
            'quantity' => $quantity,
            'unit_cost' => $unitCost,
            'amount' => bcmul($unitCost, $quantity, 2),
            'description' => $description ?: StockMovement::TYPES[$type],
            'created_by' => $user->id,
        ]);
    }

    public function balance(int $productId, CarbonInterface $asOf): string
    {
        $sum = StockMovement::query()
            ->where('product_id', $productId)
            ->whereDate('date', '<=', $asOf)
            ->selectRaw("COALESCE(SUM(CASE WHEN direction = 'in' THEN quantity ELSE -quantity END), 0) as qty")
            ->value('qty');

        return bcadd((string) $sum, '0', 3);
    }

    /** Rata-rata bergerak dari seluruh baris masuk bernilai sampai tanggal itu. */
    public function averageCost(int $productId, CarbonInterface $asOf): string
    {
        $in = StockMovement::query()
            ->where('product_id', $productId)
            ->where('direction', 'in')
            ->where('amount', '>', 0)
            ->whereDate('date', '<=', $asOf)
            ->selectRaw('COALESCE(SUM(quantity), 0) as qty, COALESCE(SUM(amount), 0) as amount')
            ->first();

        return bccomp((string) $in->qty, '0', 3) > 0 ? bcdiv((string) $in->amount, (string) $in->qty, 2) : '0.00';
    }
}
