<?php

namespace Tests\Feature\Payables;

use App\Enums\DocumentStatus;
use App\Models\Account;
use App\Models\JournalEntry;
use App\Models\Product;
use App\Models\PurchaseBill;
use App\Models\Supplier;
use App\Models\User;
use Database\Seeders\ChartOfAccountSeeder;
use Database\Seeders\MasterDataSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Menguji penutup siklus akrual pembelian: utang yang terbentuk dari tagihan
 * berkurang oleh pembayaran, dan kembali bila pembayarannya dibatalkan.
 */
class SupplierPaymentTest extends TestCase
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

        Sanctum::actingAs(User::factory()->create());
    }

    public function test_pembayaran_mengurangi_utang_sampai_lunas(): void
    {
        $bill = $this->createBill('bahan_baku_polos', 'PRD-BBP', '10000', '5000'); // 50 juta

        $payment = $this->postJson('/api/supplier-payments', [
            'date' => '2026-09-20',
            'supplier_id' => $this->supplier->id,
            'cash_account_id' => $this->bank->id,
            'reference' => 'TRF-001',
            'allocations' => [['purchase_bill_id' => $bill['id'], 'amount' => '20000000']],
        ])->assertCreated()->json('data');

        $this->assertSame('BKK/2026/09/0001', $payment['number']);
        $this->assertSame('20000000.00', $payment['amount']);

        // D Hutang Supplier Karung · K Bank BCA
        $lines = collect($payment['journal_entry']['lines']);
        $this->assertSame('20000000.00', $lines->firstWhere('account.code', '2-10001')['debit']);
        $this->assertSame('20000000.00', $lines->firstWhere('account.code', '1-10003')['credit']);

        $stored = PurchaseBill::query()->findOrFail($bill['id']);
        $this->assertSame('20000000.00', (string) $stored->paid_amount);
        $this->assertSame(DocumentStatus::Partial, $stored->status);

        $this->postJson('/api/supplier-payments', [
            'date' => '2026-09-25',
            'supplier_id' => $this->supplier->id,
            'cash_account_id' => $this->bank->id,
            'allocations' => [['purchase_bill_id' => $bill['id'], 'amount' => '30000000']],
        ])->assertCreated();

        $this->assertSame(DocumentStatus::Paid, $stored->refresh()->status);
    }

    public function test_satu_bukti_membayar_tagihan_dengan_akun_utang_berbeda(): void
    {
        $karung = $this->createBill('bahan_baku_polos', 'PRD-BBP', '1000', '5000'); // 5 juta → 2-10001
        $pendukung = $this->createBill('bahan_pendukung', 'PRD-KRG', '1000', '2000'); // 2 juta → 2-10002

        $payment = $this->postJson('/api/supplier-payments', [
            'date' => '2026-09-20',
            'supplier_id' => $this->supplier->id,
            'cash_account_id' => $this->bank->id,
            'allocations' => [
                ['purchase_bill_id' => $karung['id'], 'amount' => '5000000'],
                ['purchase_bill_id' => $pendukung['id'], 'amount' => '2000000'],
            ],
        ])->assertCreated()->json('data');

        $lines = collect($payment['journal_entry']['lines']);
        $this->assertCount(3, $lines);
        $this->assertSame('5000000.00', $lines->firstWhere('account.code', '2-10001')['debit']);
        $this->assertSame('2000000.00', $lines->firstWhere('account.code', '2-10002')['debit']);
        $this->assertSame('7000000.00', $lines->firstWhere('account.code', '1-10003')['credit']);
    }

    public function test_pembayaran_tidak_boleh_melebihi_sisa_utang(): void
    {
        $bill = $this->createBill('bahan_baku_polos', 'PRD-BBP', '1000', '5000');

        $this->postJson('/api/supplier-payments', [
            'date' => '2026-09-20',
            'supplier_id' => $this->supplier->id,
            'cash_account_id' => $this->bank->id,
            'allocations' => [['purchase_bill_id' => $bill['id'], 'amount' => '5000001']],
        ])->assertStatus(422);
    }

    public function test_tagihan_supplier_lain_ditolak(): void
    {
        $bill = $this->createBill('bahan_baku_polos', 'PRD-BBP', '1000', '5000');
        $other = Supplier::query()->where('code', 'SUP-001')->firstOrFail();

        $this->postJson('/api/supplier-payments', [
            'date' => '2026-09-20',
            'supplier_id' => $other->id,
            'cash_account_id' => $this->bank->id,
            'allocations' => [['purchase_bill_id' => $bill['id'], 'amount' => '1000000']],
        ])->assertStatus(422);
    }

    public function test_pembatalan_mengembalikan_utang_dan_membalik_jurnal(): void
    {
        $bill = $this->createBill('bahan_baku_polos', 'PRD-BBP', '1000', '5000');

        $payment = $this->postJson('/api/supplier-payments', [
            'date' => '2026-09-20',
            'supplier_id' => $this->supplier->id,
            'cash_account_id' => $this->bank->id,
            'allocations' => [['purchase_bill_id' => $bill['id'], 'amount' => '5000000']],
        ])->assertCreated()->json('data');

        $this->assertSame(DocumentStatus::Paid, PurchaseBill::query()->findOrFail($bill['id'])->status);

        $cancelled = $this->postJson("/api/supplier-payments/{$payment['id']}/cancel")
            ->assertOk()
            ->json('data');

        $this->assertSame('cancelled', $cancelled['status']);

        $stored = PurchaseBill::query()->findOrFail($bill['id']);
        $this->assertSame('0.00', (string) $stored->paid_amount);
        $this->assertSame(DocumentStatus::Unpaid, $stored->status);

        // Jurnal pembalik: D Bank · K Hutang.
        $reversal = JournalEntry::query()->orderByDesc('id')->with('lines.account')->first();
        $this->assertStringContainsString('Pembatalan', $reversal->description);
        $this->assertSame('5000000.00', (string) $reversal->lines->firstWhere('account.code', '1-10003')->debit);

        $this->postJson("/api/supplier-payments/{$payment['id']}/cancel")->assertStatus(422);
    }

    /** @return array<string, mixed> */
    private function createBill(string $category, string $productCode, string $qty, string $price): array
    {
        return $this->postJson('/api/purchase-bills', [
            'date' => '2026-09-18',
            'supplier_id' => $this->supplier->id,
            'category' => $category,
            'settlement_method' => 'payable',
            'term_days' => 14,
            'items' => [[
                'product_id' => Product::query()->where('code', $productCode)->value('id'),
                'quantity' => $qty,
                'unit_price' => $price,
            ]],
            'post' => true,
        ])->assertCreated()->json('data');
    }
}
