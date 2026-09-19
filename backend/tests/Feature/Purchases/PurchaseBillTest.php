<?php

namespace Tests\Feature\Purchases;

use App\Enums\DocumentStatus;
use App\Enums\UserRole;
use App\Models\Account;
use App\Models\JournalEntry;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\User;
use Database\Seeders\ChartOfAccountSeeder;
use Database\Seeders\MasterDataSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Menguji hal yang membedakan pembelian dari penjualan: kategorinyalah yang
 * menentukan akun mana yang didebit, dan akun utang mana yang dipakai.
 */
class PurchaseBillTest extends TestCase
{
    use RefreshDatabase;

    private Account $bank;

    private Supplier $supplier;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(ChartOfAccountSeeder::class);
        $this->seed(MasterDataSeeder::class);

        $this->bank = Account::query()->where('code', '1-10003')->firstOrFail();
        $this->supplier = Supplier::query()->where('code', 'SUP-002')->firstOrFail();

        Sanctum::actingAs(User::factory()->role(UserRole::Finance)->create());
    }

    public function test_bahan_baku_masuk_persediaan_dan_utang_supplier_karung(): void
    {
        $bill = $this->postJson('/api/purchase-bills', $this->payload([
            'category' => 'bahan_baku_polos',
            'settlement_method' => 'payable',
            'term_days' => 14,
        ]))->assertCreated()->json('data');

        $this->assertSame('PUR/2026/09/0001', $bill['number']);
        $this->assertSame('50000000.00', $bill['total']);

        // D Persediaan Bahan Baku Polos · K Hutang Supplier Karung
        $lines = collect($bill['journal_entry']['lines']);
        $this->assertSame('50000000.00', $lines->firstWhere('account.code', '1-10201')['debit']);
        $this->assertSame('50000000.00', $lines->firstWhere('account.code', '2-10001')['credit']);
        $this->assertSame(DocumentStatus::Unpaid->value, $bill['status']);
    }

    public function test_bahan_pendukung_memakai_akun_utangnya_sendiri(): void
    {
        $bill = $this->postJson('/api/purchase-bills', $this->payload([
            'category' => 'bahan_pendukung',
            'settlement_method' => 'payable',
            'term_days' => 30,
            'items' => [[
                'product_id' => Product::query()->where('code', 'PRD-KRG')->value('id'),
                'quantity' => '1000',
                'unit_price' => '5000',
            ]],
        ]))->assertCreated()->json('data');

        $lines = collect($bill['journal_entry']['lines']);
        $this->assertSame('5000000.00', $lines->firstWhere('account.code', '1-10204')['debit']);
        $this->assertSame('5000000.00', $lines->firstWhere('account.code', '2-10002')['credit']);
    }

    public function test_kategori_beban_tidak_masuk_persediaan(): void
    {
        $bill = $this->postJson('/api/purchase-bills', $this->payload([
            'category' => 'jasa_maintenance',
            'settlement_method' => 'cash',
            'cash_account_id' => $this->bank->id,
            'items' => [[
                'description' => 'Servis mesin cacah 1',
                'quantity' => '1',
                'unit' => 'Paket',
                'unit_price' => '3500000',
            ]],
        ]))->assertCreated()->json('data');

        // D Jasa Maintenance Mesin · K Bank BCA — langsung beban, lunas seketika.
        $lines = collect($bill['journal_entry']['lines']);
        $this->assertSame('3500000.00', $lines->firstWhere('account.code', '5-11006')['debit']);
        $this->assertSame('3500000.00', $lines->firstWhere('account.code', '1-10003')['credit']);
        $this->assertSame(DocumentStatus::Paid->value, $bill['status']);
        $this->assertFalse($bill['is_stock_category']);
    }

    public function test_kategori_persediaan_menuntut_produk_pada_setiap_baris(): void
    {
        $this->postJson('/api/purchase-bills', $this->payload([
            'category' => 'sparepart',
            'settlement_method' => 'cash',
            'cash_account_id' => $this->bank->id,
            'items' => [[
                'description' => 'Bearing tanpa produk',
                'quantity' => '2',
                'unit_price' => '500000',
            ]],
        ]))->assertStatus(422);

        $this->assertDatabaseCount('purchase_bills', 0);
        $this->assertDatabaseCount('journal_entries', 0);
    }

    public function test_kategori_lainnya_memerlukan_akun_beban_pilihan_sendiri(): void
    {
        $this->postJson('/api/purchase-bills', $this->payload([
            'category' => 'lainnya',
            'settlement_method' => 'cash',
            'cash_account_id' => $this->bank->id,
            'items' => [[
                'description' => 'Biaya lain-lain',
                'quantity' => '1',
                'unit_price' => '250000',
            ]],
        ]))->assertStatus(422);

        $account = Account::query()->where('code', '8-10099')->firstOrFail();

        $bill = $this->postJson('/api/purchase-bills', $this->payload([
            'category' => 'lainnya',
            'settlement_method' => 'cash',
            'cash_account_id' => $this->bank->id,
            'expense_account_id' => $account->id,
            'items' => [[
                'description' => 'Biaya lain-lain',
                'quantity' => '1',
                'unit_price' => '250000',
            ]],
        ]))->assertCreated()->json('data');

        $lines = collect($bill['journal_entry']['lines']);
        $this->assertSame('250000.00', $lines->firstWhere('account.code', '8-10099')['debit']);
    }

    public function test_pembatalan_membentuk_jurnal_pembalik(): void
    {
        $bill = $this->postJson('/api/purchase-bills', $this->payload([
            'category' => 'bahan_baku_polos',
            'settlement_method' => 'payable',
            'term_days' => 14,
        ]))->assertCreated()->json('data');

        $this->postJson("/api/purchase-bills/{$bill['id']}/cancel")
            ->assertOk()
            ->assertJsonPath('data.status', DocumentStatus::Cancelled->value);

        $this->assertSame(2, JournalEntry::query()->count());

        $reversal = JournalEntry::query()->with('lines.account')->latest('id')->firstOrFail();
        $this->assertSame('50000000.00', $reversal->lines->firstWhere('account.code', '1-10201')->credit);
    }

    /** @param  array<string, mixed>  $overrides */
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'date' => '2026-09-18',
            'supplier_id' => $this->supplier->id,
            'supplier_invoice_number' => 'NOTA-8821',
            'items' => [[
                'product_id' => Product::query()->where('code', 'PRD-BBP')->value('id'),
                'quantity' => '10000',
                'unit_price' => '5000',
            ]],
        ], $overrides);
    }
}
