<?php

namespace Tests\Feature\Setup;

use App\Enums\UserRole;
use App\Models\User;
use Database\Seeders\ChartOfAccountSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Saldo awal, tutup buku, pengaturan, dan matriks peran. */
class OpeningBalanceAndPeriodTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(ChartOfAccountSeeder::class);
        Sanctum::actingAs(User::factory()->role(UserRole::Finance)->create());
    }

    public function test_saldo_awal_diseimbangkan_ke_ekuitas_penyesuaian(): void
    {
        $entry = $this->postJson('/api/opening-balances', [
            'date' => '2026-04-01',
            'rows' => [
                ['account_code' => '1-10003', 'amount' => '35473425'],   // Bank BCA
                ['account_code' => '1-20004', 'amount' => '2418500000'], // Mesin Biji
                ['account_code' => '2-10000', 'amount' => '196714000'],  // Hutang Usaha
                ['account_code' => '3-10000', 'amount' => '2000000000'], // Modal
            ],
        ])->assertCreated()->json('data');

        $this->assertSame('opening_balance', $entry['source']);
        $lines = collect($entry['lines']);
        // Debit 2.453.973.425 − Kredit 2.196.714.000 = 257.259.425 → K 3-10006.
        $this->assertSame('257259425.00', $lines->firstWhere('account.code', '3-10006')['credit']);

        $balance = $this->getJson('/api/reports/balance-sheet?year=2026&month=4')->json('data.totals');
        $this->assertSame('0.00', $balance['difference']);
        $this->assertSame('2453973425.00', $balance['total_assets']);
    }

    public function test_akun_laba_rugi_ditolak_pada_saldo_awal(): void
    {
        $this->postJson('/api/opening-balances', [
            'date' => '2026-04-01',
            'rows' => [['account_code' => '4-10000', 'amount' => '1000']],
        ])->assertStatus(422);
    }

    public function test_tutup_buku_menolak_jurnal_baru_dan_harus_berurutan(): void
    {
        $this->postJson('/api/journal-entries', [
            'date' => '2026-08-10', 'description' => 'Agustus',
            'lines' => [['account_code' => '6-10012', 'debit' => '1000'], ['account_code' => '1-10003', 'credit' => '1000']],
        ])->assertCreated();

        // September belum boleh ditutup selama Agustus (yang punya jurnal) masih terbuka.
        $this->postJson('/api/fiscal-periods/close', ['year' => 2026, 'month' => 9])->assertStatus(422);

        $this->postJson('/api/fiscal-periods/close', ['year' => 2026, 'month' => 8])->assertOk();

        $this->postJson('/api/journal-entries', [
            'date' => '2026-08-20', 'description' => 'Terlambat',
            'lines' => [['account_code' => '6-10012', 'debit' => '1000'], ['account_code' => '1-10003', 'credit' => '1000']],
        ])->assertStatus(422);

        // Membuka kembali hanya Super Admin.
        $this->postJson('/api/fiscal-periods/reopen', ['year' => 2026, 'month' => 8])->assertStatus(403);

        Sanctum::actingAs(User::factory()->role(UserRole::SuperAdmin)->create());
        $this->postJson('/api/fiscal-periods/reopen', ['year' => 2026, 'month' => 8])->assertOk();
        $this->assertSame('open', collect($this->getJson('/api/fiscal-periods?year=2026')->json('data'))->firstWhere('month', 8)['status']);
    }

    public function test_pengaturan_memengaruhi_standar_rasio(): void
    {
        Sanctum::actingAs(User::factory()->role(UserRole::SuperAdmin)->create());

        $this->putJson('/api/settings', [
            'ratio_standards' => ['current_ratio' => 2, 'quick_ratio' => 1.5, 'gross_profit_margin' => 0.4, 'net_profit_margin' => 0.25, 'debt_to_equity' => 1, 'cashflow_to_revenue' => 0.3],
            'company' => ['name' => 'PT Triplastindo Jaya'],
        ])->assertOk()->assertJsonPath('data.company.name', 'PT Triplastindo Jaya');

        $ratios = collect($this->getJson('/api/reports/balance-sheet?year=2026&month=9')->json('data.ratios'))->keyBy('key');
        $this->assertEquals(2, $ratios['current_ratio']['standard']);
    }

    public function test_matriks_peran(): void
    {
        Sanctum::actingAs(User::factory()->role(UserRole::Viewer)->create());
        $this->getJson('/api/dashboard')->assertOk();
        $this->getJson('/api/journal-entries')->assertStatus(403);
        $this->postJson('/api/expenses', [])->assertStatus(403);

        Sanctum::actingAs(User::factory()->role(UserRole::Hr)->create());
        $this->getJson('/api/dashboard')->assertStatus(403);
        $this->getJson('/api/employees')->assertOk();

        Sanctum::actingAs(User::factory()->role(UserRole::Direksi)->create());
        $this->getJson('/api/journal-entries')->assertOk();
        $this->postJson('/api/journal-entries', [])->assertStatus(403);
    }
}
