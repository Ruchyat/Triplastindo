<?php

namespace Tests\Feature\ProfitSharing;

use App\Enums\UserRole;
use App\Models\Account;
use App\Models\Shareholder;
use App\Models\User;
use Database\Seeders\ChartOfAccountSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Dividen: alokasi per saham, pajak final, check point kas, dan persetujuan Direksi. */
class DividendTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(ChartOfAccountSeeder::class);
        Shareholder::query()->create(['name' => 'Koh Yadie', 'shares' => 1_440_000]);
        Shareholder::query()->create(['name' => 'Pak Satria', 'shares' => 1_200_000]);
        Shareholder::query()->create(['name' => 'Koh Apin', 'shares' => 760_000]);
        Shareholder::query()->create(['name' => 'Pak Andri', 'shares' => 200_000]);
    }

    public function test_pengajuan_alokasi_dan_persetujuan(): void
    {
        Sanctum::actingAs(User::factory()->role(UserRole::Finance)->create());
        $bank = Account::query()->where('code', '1-10003')->value('id');

        // Kas 300 juta dari modal, supaya check point aman (minimum 200 juta).
        $this->postJson('/api/journal-entries', [
            'date' => '2026-06-01', 'description' => 'Modal',
            'lines' => [['account_code' => '1-10003', 'debit' => '300000000'], ['account_code' => '3-10000', 'credit' => '300000000']],
        ])->assertCreated();

        $decision = $this->postJson('/api/dividend-decisions', [
            'year' => 2026, 'month' => 6, 'decision_date' => '2026-06-30',
            'total_amount' => '100000000', 'cash_account_id' => $bank,
        ])->assertCreated()->json('data');

        $this->assertSame('draft', $decision['status']);
        $this->assertTrue($decision['is_safe']);
        $allocations = collect($decision['allocations'])->keyBy('shareholder');
        $this->assertSame('40000000.00', $allocations['Koh Yadie']['gross']);
        $this->assertSame('36000000.00', $allocations['Koh Yadie']['net']);
        $this->assertSame('100000000.00', collect($decision['allocations'])->reduce(fn ($s, $a) => bcadd($s, $a['gross'], 2), '0.00'));

        // Finance tidak boleh menyetujui.
        $this->postJson("/api/dividend-decisions/{$decision['id']}/approve")->assertStatus(403);

        Sanctum::actingAs(User::factory()->role(UserRole::Direksi)->create());
        $approved = $this->postJson("/api/dividend-decisions/{$decision['id']}/approve")->assertOk()->json('data');
        $this->assertSame('approved', $approved['status']);

        $lines = collect($approved['journal_entry']['lines']);
        $this->assertSame('100000000.00', $lines->firstWhere('account.code', '3-10004')['debit']);
        $this->assertSame('10000000.00', $lines->firstWhere('account.code', '2-10106')['credit']);
        $this->assertSame('90000000.00', $lines->firstWhere('account.code', '1-10003')['credit']);

        $checkpoints = collect($this->getJson('/api/dividend-decisions/checkpoints?year=2026')->json('data.months'));
        $june = $checkpoints->firstWhere('month', 6);
        $this->assertSame('100000000.00', $june['distributed']);
        $this->assertSame('210000000.00', $june['cash_balance']);
    }
}
