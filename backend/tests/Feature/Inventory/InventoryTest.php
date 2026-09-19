<?php

namespace Tests\Feature\Inventory;

use App\Enums\UserRole;
use App\Models\Account;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\User;
use Database\Seeders\ChartOfAccountSeeder;
use Database\Seeders\MasterDataSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Kartu stok mengikuti pembelian, pemakaian, produksi, dan penjualan. */
class InventoryTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(ChartOfAccountSeeder::class);
        $this->seed(MasterDataSeeder::class);
        Sanctum::actingAs(User::factory()->role(UserRole::Finance)->create());
    }

    public function test_alur_pembelian_pemakaian_produksi_penjualan(): void
    {
        $bahan = Product::query()->where('code', 'PRD-BBP')->firstOrFail();
        $tali = Product::query()->where('code', 'PRD-TAL')->firstOrFail();

        // Beli 1.000 Kg bahan baku @5.000 (bertermin) → stok masuk.
        $this->postJson('/api/purchase-bills', [
            'date' => '2026-09-01', 'supplier_id' => Supplier::query()->where('code', 'SUP-002')->value('id'),
            'category' => 'bahan_baku_polos', 'settlement_method' => 'payable', 'term_days' => 30,
            'items' => [['product_id' => $bahan->id, 'quantity' => '1000', 'unit_price' => '5000']], 'post' => true,
        ])->assertCreated();

        // Pakai 600 Kg → D 5-10000 · K 1-10201 sebesar 3.000.000.
        $consumed = $this->postJson('/api/stock-movements', [
            'date' => '2026-09-05', 'product_id' => $bahan->id, 'type' => 'consumption', 'quantity' => '600',
        ])->assertCreated()->json('data');
        $this->assertSame('3000000.00', $consumed['amount']);

        // Tidak boleh memakai lebih dari stok.
        $this->postJson('/api/stock-movements', ['date' => '2026-09-06', 'product_id' => $bahan->id, 'type' => 'consumption', 'quantity' => '500'])->assertStatus(422);

        // Hasil produksi 500 Kg tali, jual 200 Kg @ 12.000.
        $this->postJson('/api/stock-movements', ['date' => '2026-09-07', 'product_id' => $tali->id, 'type' => 'production_in', 'quantity' => '500'])->assertCreated();
        $this->postJson('/api/sales-invoices', [
            'date' => '2026-09-10', 'customer_id' => Customer::query()->where('code', 'CUS-001')->value('id'),
            'settlement_method' => 'cash', 'cash_account_id' => Account::query()->where('code', '1-10003')->value('id'), 'use_deposit' => false,
            'items' => [['product_id' => $tali->id, 'quantity' => '200', 'unit_price' => '12000']], 'post' => true,
        ])->assertCreated();

        $summary = $this->getJson('/api/inventory/summary?year=2026')->assertOk()->json('data');
        $products = collect($summary['products'])->keyBy('code');

        $this->assertSame('400.000', $products['PRD-BBP']['totals']['qty_balance']);
        $this->assertSame('2000000.00', $products['PRD-BBP']['totals']['inventory_value']);
        $this->assertSame('300.000', $products['PRD-TAL']['totals']['qty_balance']);
        $this->assertSame('200.000', $products['PRD-TAL']['totals']['sold_qty']);
        $this->assertSame('2400000.00', $products['PRD-TAL']['totals']['sales_amount']);

        // HPP per Kg: HPP 3.000.000 / 500 Kg produksi = 6.000; harga jual 12.000.
        $this->assertSame('6000.00', $summary['hpp_per_kg']['hpp_per_kg']);
        $this->assertSame('12000.00', $summary['hpp_per_kg']['selling_price_per_kg']);
        $this->assertSame('6000.00', $summary['hpp_per_kg']['margin_per_kg']);

        // Persediaan di neraca: 2.000.000 (bahan baku sisa).
        $this->assertSame('2000000.00', $this->getJson('/api/reports/balance-sheet?year=2026&month=9')->json('data.totals.inventory'));
    }
}
