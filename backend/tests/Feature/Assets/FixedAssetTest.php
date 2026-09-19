<?php

namespace Tests\Feature\Assets;

use App\Enums\UserRole;
use App\Models\Account;
use App\Models\AssetType;
use App\Models\User;
use Database\Seeders\AssetTypeSeeder;
use Database\Seeders\ChartOfAccountSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Aset tetap disusutkan garis lurus per bulan, dan pelepasannya mencatat rugi/laba. */
class FixedAssetTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(ChartOfAccountSeeder::class);
        $this->seed(AssetTypeSeeder::class);
        Sanctum::actingAs(User::factory()->role(UserRole::Finance)->create());
    }

    public function test_pembelian_tunai_dan_penyusutan_bulanan(): void
    {
        $type = AssetType::query()->where('name', 'Mesin Biji')->firstOrFail();

        $asset = $this->postJson('/api/fixed-assets', [
            'code' => 'MCC-01',
            'name' => 'Mesin Cacah 1',
            'asset_type_id' => $type->id,
            'acquisition_date' => '2026-04-01',
            'cost' => '50000000',
            'useful_life_years' => 16,
            'funding' => 'cash',
            'cash_account_id' => Account::query()->where('code', '1-10003')->value('id'),
        ])->assertCreated()->json('data');

        // Residu 1% = 500.000; (50.000.000 − 500.000) / 192 bulan = 257.812,50.
        $this->assertSame('500000.00', $asset['residual_value']);
        $this->assertSame('257812.50', $asset['monthly_depreciation']);

        $run = $this->postJson('/api/fixed-assets/depreciations', ['year' => 2026, 'month' => 4])->assertCreated()->json('data');
        $this->assertSame(1, $run['count']);
        $this->assertSame('257812.50', $run['total']);

        // Bulan yang sama tidak boleh dijalankan dua kali.
        $this->postJson('/api/fixed-assets/depreciations', ['year' => 2026, 'month' => 4])->assertStatus(422);
        $this->postJson('/api/fixed-assets/depreciations', ['year' => 2026, 'month' => 5])->assertCreated();

        $detail = $this->getJson("/api/fixed-assets/{$asset['id']}")->json('data');
        $this->assertSame('515625.00', $detail['accumulated_depreciation']);
        $this->assertSame('49484375.00', $detail['book_value']);

        // Neraca: mesin 50 juta, akumulasi 515.625; beban penyusutan 5-11007 di laba rugi.
        $balance = $this->getJson('/api/reports/balance-sheet?year=2026&month=5')->json('data.totals');
        $this->assertSame('515625.00', $balance['accumulated_depreciation']);
        $this->assertSame('0.00', $balance['difference']);

        // Pembatalan harus dari bulan terakhir.
        $this->deleteJson('/api/fixed-assets/depreciations', ['year' => 2026, 'month' => 4])->assertStatus(422);
        $this->deleteJson('/api/fixed-assets/depreciations', ['year' => 2026, 'month' => 5])->assertOk();
        $this->assertSame('257812.50', $this->getJson("/api/fixed-assets/{$asset['id']}")->json('data.accumulated_depreciation'));
    }

    public function test_pelepasan_mencatat_rugi(): void
    {
        $type = AssetType::query()->where('name', 'Peralatan Kantor')->firstOrFail();
        $asset = $this->postJson('/api/fixed-assets', [
            'code' => 'TVD-01', 'name' => 'TV', 'asset_type_id' => $type->id,
            'acquisition_date' => '2026-01-01', 'cost' => '5000000', 'funding' => 'opening',
        ])->assertCreated()->json('data');

        $disposed = $this->postJson("/api/fixed-assets/{$asset['id']}/dispose", [
            'date' => '2026-09-01', 'proceeds' => '3000000',
            'cash_account_id' => Account::query()->where('code', '1-10003')->value('id'),
        ])->assertOk()->json('data');

        $this->assertSame('disposed', $disposed['status']);

        $pl = $this->getJson('/api/reports/profit-loss?year=2026&month=9')->json('data.period');
        $loss = collect($pl['sections'])->firstWhere('key', 'other_expenses')['total'];
        $this->assertSame('2000000.00', $loss);
    }
}
