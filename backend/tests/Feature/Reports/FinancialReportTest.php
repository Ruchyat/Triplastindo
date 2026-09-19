<?php

namespace Tests\Feature\Reports;

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

/**
 * Laporan keuangan dihitung dari jurnal yang sama dengan Buku Besar, dan
 * ketiganya harus saling mengunci: laba bersih masuk ekuitas, saldo kas akhir
 * Arus Kas sama dengan kas di Neraca, dan neraca seimbang.
 */
class FinancialReportTest extends TestCase
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

        // Modal awal 100 juta masuk bank (pendanaan), Agustus.
        $this->postJson('/api/journal-entries', [
            'date' => '2026-08-01',
            'description' => 'Setoran modal',
            'lines' => [
                ['account_code' => '1-10003', 'debit' => '100000000'],
                ['account_code' => '3-10000', 'credit' => '100000000'],
            ],
        ])->assertCreated();

        // Beli mesin 20 juta tunai (investasi), Agustus.
        $this->postJson('/api/journal-entries', [
            'date' => '2026-08-05',
            'description' => 'Beli mesin tali',
            'lines' => [
                ['account_code' => '1-20005', 'debit' => '20000000'],
                ['account_code' => '1-10003', 'credit' => '20000000'],
            ],
        ])->assertCreated();

        // September: penjualan tunai 50 juta, pembelian bahan baku bertermin 30 juta, listrik 5 juta.
        $this->postJson('/api/sales-invoices', [
            'date' => '2026-09-05',
            'customer_id' => Customer::query()->where('code', 'CUS-001')->value('id'),
            'settlement_method' => 'cash',
            'cash_account_id' => $this->bank->id,
            'use_deposit' => false,
            'items' => [['product_id' => Product::query()->where('code', 'PRD-TAL')->value('id'), 'quantity' => '1', 'unit_price' => '50000000']],
            'post' => true,
        ])->assertCreated();

        $this->postJson('/api/purchase-bills', [
            'date' => '2026-09-10',
            'supplier_id' => Supplier::query()->where('code', 'SUP-002')->value('id'),
            'category' => 'bahan_baku_polos',
            'settlement_method' => 'payable',
            'term_days' => 30,
            'items' => [['product_id' => Product::query()->where('code', 'PRD-BBP')->value('id'), 'quantity' => '1', 'unit_price' => '30000000']],
            'post' => true,
        ])->assertCreated();

        $this->postJson('/api/expenses', [
            'date' => '2026-09-15',
            'expense_account_id' => Account::query()->where('code', '5-11003')->value('id'),
            'cash_account_id' => $this->bank->id,
            'description' => 'Listrik',
            'amount' => '5000000',
        ])->assertCreated();
    }

    public function test_laba_rugi_bulan_dan_ytd(): void
    {
        $report = $this->getJson('/api/reports/profit-loss?year=2026&month=9')->assertOk()->json('data');

        $this->assertSame('50000000.00', $report['period']['results']['revenue']);
        $this->assertSame('5000000.00', $report['period']['sections'][1]['total']); // HPP: listrik produksi
        $this->assertSame('45000000.00', $report['period']['results']['gross_profit']);
        $this->assertSame('45000000.00', $report['period']['results']['net_profit']);
        // Agustus tidak punya transaksi laba rugi, jadi YTD sama dengan September.
        $this->assertSame('45000000.00', $report['ytd']['results']['net_profit']);

        $revenueRow = collect($report['period']['sections'][0]['rows'])->firstWhere('code', '4-10000');
        $this->assertSame('50000000.00', $revenueRow['amount']);
    }

    public function test_neraca_seimbang_dan_memuat_laba_berjalan(): void
    {
        $report = $this->getJson('/api/reports/balance-sheet?year=2026&month=9')->assertOk()->json('data');
        $t = $report['totals'];

        // Kas: 100 − 20 + 50 − 5 = 125 juta; persediaan 30 juta; mesin 20 juta.
        $this->assertSame('125000000.00', $t['cash']);
        $this->assertSame('30000000.00', $t['inventory']);
        $this->assertSame('175000000.00', $t['total_assets']);
        $this->assertSame('30000000.00', $t['liabilities']);
        $this->assertSame('45000000.00', $report['earnings']['current_year']);
        $this->assertSame('145000000.00', $t['equity']);
        $this->assertSame('0.00', $t['difference']);

        $ratios = collect($report['ratios'])->keyBy('key');
        $this->assertEqualsWithDelta(155 / 30, $ratios['current_ratio']['value'], 0.001);
        $this->assertSame('good', $ratios['current_ratio']['verdict']);
        $this->assertEqualsWithDelta(0.9, $ratios['gross_profit_margin']['value'], 0.001);
        $this->assertEqualsWithDelta(30 / 145, $ratios['debt_to_equity']['value'], 0.001);
        $this->assertSame('good', $ratios['debt_to_equity']['verdict']);
    }

    public function test_arus_kas_mengelompokkan_operasi_investasi_pendanaan(): void
    {
        $report = $this->getJson('/api/reports/cash-flow?year=2026&month=9')->assertOk()->json('data');

        $september = $report['period'];
        $this->assertSame('80000000.00', $september['summary']['opening_balance']);
        $this->assertSame('45000000.00', $september['summary']['net_operating']);
        $this->assertSame('125000000.00', $september['summary']['closing_balance']);
        $this->assertSame($september['summary']['closing_balance'], $september['summary']['ledger_cash']);

        $ytd = $report['ytd'];
        $rows = collect($ytd['activities'])->flatMap(fn ($a) => $a['rows'])->keyBy('key');
        $this->assertSame('50000000.00', $rows['customer_receipts']['amount']);
        $this->assertSame('-5000000.00', $rows['operating_payments']['amount']);
        $this->assertSame('-20000000.00', $rows['asset_purchases']['amount']);
        $this->assertSame('100000000.00', $rows['capital_in']['amount']);
        $this->assertSame('0.00', $ytd['summary']['opening_balance']);
        $this->assertSame('125000000.00', $ytd['summary']['closing_balance']);
        $this->assertSame('125000000.00', $report['balance_sheet_cash']);
    }

    public function test_transfer_antar_kas_tidak_masuk_arus_kas(): void
    {
        $this->postJson('/api/cash-transfers', [
            'date' => '2026-09-20',
            'from_account_id' => $this->bank->id,
            'to_account_id' => Account::query()->where('code', '1-10001')->value('id'),
            'amount' => '10000000',
        ])->assertCreated();

        $summary = $this->getJson('/api/reports/cash-flow?year=2026&month=9')->json('data.period.summary');
        $this->assertSame('45000000.00', $summary['net_change']);
        $this->assertSame('125000000.00', $summary['closing_balance']);
    }

    public function test_dashboard_merangkum_laporan(): void
    {
        $dashboard = $this->getJson('/api/dashboard?year=2026&month=9')->assertOk()->json('data');

        $this->assertSame('50000000.00', $dashboard['period']['revenue']);
        $this->assertSame('45000000.00', $dashboard['ytd']['net_profit']);
        $this->assertSame('125000000.00', $dashboard['cash']['total']);
        $this->assertSame('125000000.00', $dashboard['cash_flow_ytd']['closing']);
        $this->assertSame('150000000.00', $dashboard['cash_flow_ytd']['incoming']);
        $this->assertSame('25000000.00', $dashboard['cash_flow_ytd']['outgoing']);
        $this->assertCount(12, $dashboard['monthly']);
        $this->assertSame('50000000.00', $dashboard['monthly'][8]['revenue']);
        $this->assertSame('30000000.00', $dashboard['payables']['outstanding']);
        $this->assertSame('50000000.00', $dashboard['receivables']['total']);
        $this->assertSame('50000000.00', $dashboard['receivables']['paid']);
    }
}
