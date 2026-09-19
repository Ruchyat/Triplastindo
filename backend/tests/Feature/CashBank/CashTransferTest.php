<?php

namespace Tests\Feature\CashBank;

use App\Enums\UserRole;
use App\Models\Account;
use App\Models\User;
use Database\Seeders\ChartOfAccountSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Transfer kas memindahkan uang antar akun tanpa menyentuh laba rugi. */
class CashTransferTest extends TestCase
{
    use RefreshDatabase;

    private Account $bank;

    private Account $cash;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(ChartOfAccountSeeder::class);
        $this->bank = Account::query()->where('code', '1-10003')->firstOrFail();
        $this->cash = Account::query()->where('code', '1-10001')->firstOrFail();

        Sanctum::actingAs(User::factory()->role(UserRole::Finance)->create());
    }

    public function test_transfer_mendebit_tujuan_dan_mengkredit_asal(): void
    {
        $transfer = $this->postJson('/api/cash-transfers', [
            'date' => '2026-09-18',
            'from_account_id' => $this->bank->id,
            'to_account_id' => $this->cash->id,
            'amount' => '5000000',
            'reference' => 'Tarik tunai',
        ])->assertCreated()->json('data');

        $this->assertSame('TRF/2026/09/0001', $transfer['number']);

        $lines = collect($transfer['journal_entry']['lines']);
        $this->assertSame('5000000.00', $lines->firstWhere('account.code', '1-10001')['debit']);
        $this->assertSame('5000000.00', $lines->firstWhere('account.code', '1-10003')['credit']);

        $accounts = collect($this->getJson('/api/cash-accounts?as_of=2026-09-30')->assertOk()->json('data'));
        $this->assertSame('5000000.00', $accounts->firstWhere('code', '1-10001')['balance']);
        $this->assertSame('-5000000.00', $accounts->firstWhere('code', '1-10003')['balance']);

        $mutations = $this->getJson('/api/cash-mutations?from=2026-09-01&to=2026-09-30')->assertOk()->json('data');
        $this->assertCount(2, $mutations);
        $this->assertSame('Transfer Kas', $mutations[0]['source_label']);
    }

    public function test_akun_asal_dan_tujuan_tidak_boleh_sama(): void
    {
        $this->postJson('/api/cash-transfers', [
            'date' => '2026-09-18',
            'from_account_id' => $this->bank->id,
            'to_account_id' => $this->bank->id,
            'amount' => '1000',
        ])->assertStatus(422);
    }

    public function test_akun_bukan_kas_ditolak(): void
    {
        $this->postJson('/api/cash-transfers', [
            'date' => '2026-09-18',
            'from_account_id' => $this->bank->id,
            'to_account_id' => Account::query()->where('code', '1-10100')->value('id'),
            'amount' => '1000',
        ])->assertStatus(422);
    }

    public function test_pembatalan_mengembalikan_saldo(): void
    {
        $transfer = $this->postJson('/api/cash-transfers', [
            'date' => '2026-09-18',
            'from_account_id' => $this->bank->id,
            'to_account_id' => $this->cash->id,
            'amount' => '5000000',
        ])->assertCreated()->json('data');

        $this->postJson("/api/cash-transfers/{$transfer['id']}/cancel")->assertOk()
            ->assertJsonPath('data.status', 'cancelled');

        $accounts = collect($this->getJson('/api/cash-accounts')->json('data'));
        $this->assertSame('0.00', $accounts->firstWhere('code', '1-10001')['balance']);
        $this->assertSame('0.00', $accounts->firstWhere('code', '1-10003')['balance']);
    }
}
