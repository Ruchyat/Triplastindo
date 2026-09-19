<?php

namespace Tests\Feature\Accounting;

use App\Enums\UserRole;
use App\Models\Account;
use App\Models\Customer;
use App\Models\Product;
use App\Models\User;
use Database\Seeders\ChartOfAccountSeeder;
use Database\Seeders\MasterDataSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Buku Besar dan Neraca Saldo dihitung dari jurnal yang sama yang dilihat di
 * Jurnal Umum; saldo awal adalah segala yang terjadi sebelum rentangnya.
 */
class LedgerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(ChartOfAccountSeeder::class);
        $this->seed(MasterDataSeeder::class);

        Sanctum::actingAs(User::factory()->role(UserRole::Finance)->create());
    }

    public function test_saldo_awal_mutasi_dan_saldo_akhir_mengikuti_saldo_normal(): void
    {
        $bank = Account::query()->where('code', '1-10003')->firstOrFail();

        // Agustus: penjualan tunai 10 juta masuk bank.
        $this->cashSale('2026-08-15', '10000000');
        // September: penjualan tunai 4 juta, lalu jurnal manual 1 juta keluar dari bank.
        $this->cashSale('2026-09-05', '4000000');
        $this->postJson('/api/journal-entries', [
            'date' => '2026-09-10',
            'description' => 'Biaya admin bank',
            'lines' => [
                ['account_code' => '6-10005', 'debit' => '1000000'],
                ['account_code' => '1-10003', 'credit' => '1000000'],
            ],
        ])->assertCreated();

        $ledger = $this->getJson("/api/ledger/{$bank->id}?from=2026-09-01&to=2026-09-30")
            ->assertOk()
            ->json('data');

        $this->assertSame('10000000.00', $ledger['opening_balance']);
        $this->assertSame('4000000.00', $ledger['total_debit']);
        $this->assertSame('1000000.00', $ledger['total_credit']);
        $this->assertSame('13000000.00', $ledger['closing_balance']);
        $this->assertCount(2, $ledger['lines']);
        $this->assertSame('14000000.00', $ledger['lines'][0]['balance']);
        $this->assertSame('13000000.00', $ledger['lines'][1]['balance']);

        $trial = collect($this->getJson('/api/ledger?from=2026-09-01&to=2026-09-30')->assertOk()->json('data'));

        $bankRow = $trial->firstWhere('account.code', '1-10003');
        $this->assertSame('10000000.00', $bankRow['opening_balance']);
        $this->assertSame('13000000.00', $bankRow['closing_balance']);

        // Akun pendapatan bersaldo normal kredit: saldo positif meski hanya dikredit.
        $revenue = $trial->firstWhere('account.code', '4-10000');
        $this->assertSame('10000000.00', $revenue['opening_balance']);
        $this->assertSame('4000000.00', $revenue['credit']);
        $this->assertSame('14000000.00', $revenue['closing_balance']);
    }

    public function test_jurnal_yang_dihapus_tidak_ikut_dihitung(): void
    {
        $entry = $this->postJson('/api/journal-entries', [
            'date' => '2026-09-10',
            'description' => 'Salah input',
            'lines' => [
                ['account_code' => '6-10005', 'debit' => '1000000'],
                ['account_code' => '1-10003', 'credit' => '1000000'],
            ],
        ])->assertCreated()->json('data');

        $this->deleteJson("/api/journal-entries/{$entry['id']}")->assertOk();

        $trial = $this->getJson('/api/ledger?from=2026-09-01&to=2026-09-30')->assertOk()->json('data');
        $this->assertSame([], $trial);
    }

    private function cashSale(string $date, string $price): void
    {
        $this->postJson('/api/sales-invoices', [
            'date' => $date,
            'customer_id' => Customer::query()->where('code', 'CUS-001')->value('id'),
            'settlement_method' => 'cash',
            'cash_account_id' => Account::query()->where('code', '1-10003')->value('id'),
            'use_deposit' => false,
            'items' => [[
                'product_id' => Product::query()->where('code', 'PRD-TAL')->value('id'),
                'quantity' => '1',
                'unit_price' => $price,
            ]],
            'post' => true,
        ])->assertCreated();
    }
}
