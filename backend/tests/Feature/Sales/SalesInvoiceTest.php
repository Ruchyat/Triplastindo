<?php

namespace Tests\Feature\Sales;

use App\Enums\DocumentStatus;
use App\Enums\UserRole;
use App\Models\Account;
use App\Models\Customer;
use App\Models\JournalEntry;
use App\Models\Product;
use App\Models\User;
use Database\Seeders\ChartOfAccountSeeder;
use Database\Seeders\MasterDataSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Menguji terjemahan dari kejadian bisnis menjadi jurnal.
 *
 * Keseimbangan jurnalnya sendiri sudah dijamin JournalPoster dan diuji
 * terpisah; yang diperiksa di sini adalah apakah invoice penjualan
 * menghasilkan baris yang benar pada akun yang benar.
 */
class SalesInvoiceTest extends TestCase
{
    use RefreshDatabase;

    private Account $bank;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(ChartOfAccountSeeder::class);
        $this->seed(MasterDataSeeder::class);

        $this->bank = Account::query()->where('code', '1-10003')->firstOrFail();

        Sanctum::actingAs(User::factory()->role(UserRole::Finance)->create());
    }

    public function test_invoice_tunai_langsung_lunas_dan_menambah_kas(): void
    {
        $response = $this->postJson('/api/sales-invoices', $this->payload([
            'settlement_method' => 'cash',
            'cash_account_id' => $this->bank->id,
        ]))->assertCreated();

        $invoice = $response->json('data');

        $this->assertSame('INV/2026/09/0001', $invoice['number']);
        $this->assertSame('105000000.00', $invoice['total']);
        $this->assertSame(DocumentStatus::Paid->value, $invoice['status']);
        $this->assertSame('0.00', $invoice['outstanding_amount']);

        // D Bank BCA 105jt · K Penjualan Tali 105jt
        $lines = collect($invoice['journal_entry']['lines']);
        $this->assertCount(2, $lines);
        $this->assertSame('105000000.00', $lines->firstWhere('account.code', '1-10003')['debit']);
        $this->assertSame('105000000.00', $lines->firstWhere('account.code', '4-10000')['credit']);
        $this->assertSame('kas_bank', $invoice['journal_entry']['tagging']);
    }

    public function test_invoice_kredit_dengan_dp_menyisakan_piutang(): void
    {
        $response = $this->postJson('/api/sales-invoices', $this->payload([
            'settlement_method' => 'receivable',
            'cash_account_id' => $this->bank->id,
            'term_days' => 30,
            'down_payment' => '25000000',
        ]))->assertCreated();

        $invoice = $response->json('data');

        $this->assertSame(DocumentStatus::Partial->value, $invoice['status']);
        $this->assertSame('80000000.00', $invoice['outstanding_amount']);
        $this->assertSame('2026-10-17', $invoice['due_date']);

        // D Bank 25jt · D Piutang Usaha 80jt · K Penjualan Tali 105jt
        $lines = collect($invoice['journal_entry']['lines']);
        $this->assertSame('25000000.00', $lines->firstWhere('account.code', '1-10003')['debit']);
        $this->assertSame('80000000.00', $lines->firstWhere('account.code', '1-10100')['debit']);
        $this->assertSame('105000000.00', $lines->firstWhere('account.code', '4-10000')['credit']);
    }

    public function test_pembatalan_membentuk_jurnal_pembalik(): void
    {
        $invoice = $this->postJson('/api/sales-invoices', $this->payload([
            'settlement_method' => 'cash',
            'cash_account_id' => $this->bank->id,
        ]))->json('data');

        $this->postJson("/api/sales-invoices/{$invoice['id']}/cancel")
            ->assertOk()
            ->assertJsonPath('data.status', DocumentStatus::Cancelled->value);

        // Jurnal aslinya tetap ada; pembatalan ditambahkan sebagai jurnal
        // tersendiri, bukan dengan menghapus yang lama.
        $this->assertSame(2, JournalEntry::query()->count());

        $reversal = JournalEntry::query()->with('lines.account')->latest('id')->firstOrFail();
        $this->assertSame("Pembatalan {$invoice['number']}", $reversal->description);
        $this->assertSame('105000000.00', $reversal->lines->firstWhere('account.code', '1-10003')->credit);
    }

    public function test_invoice_tanpa_akun_kas_ditolak(): void
    {
        $this->postJson('/api/sales-invoices', $this->payload([
            'settlement_method' => 'cash',
        ]))->assertStatus(422);

        $this->assertDatabaseCount('sales_invoices', 0);
        $this->assertDatabaseCount('journal_entries', 0);
    }

    /** @param  array<string, mixed>  $overrides */
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'date' => '2026-09-17',
            'customer_id' => Customer::query()->where('code', 'CUS-001')->value('id'),
            'items' => [[
                'product_id' => Product::query()->where('code', 'PRD-TAL')->value('id'),
                'quantity' => '10000',
                'unit_price' => '10500',
            ]],
        ], $overrides);
    }
}
