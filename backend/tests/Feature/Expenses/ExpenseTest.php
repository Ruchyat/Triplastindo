<?php

namespace Tests\Feature\Expenses;

use App\Enums\UserRole;
use App\Models\Account;
use App\Models\User;
use Database\Seeders\ChartOfAccountSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Pengeluaran: beban bertambah, kas berkurang, dan dapat dibatalkan. */
class ExpenseTest extends TestCase
{
    use RefreshDatabase;

    private Account $bank;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(ChartOfAccountSeeder::class);
        $this->bank = Account::query()->where('code', '1-10003')->firstOrFail();

        Sanctum::actingAs(User::factory()->role(UserRole::Finance)->create());
    }

    public function test_pengeluaran_mendebit_beban_dan_mengkredit_kas(): void
    {
        $expense = $this->postJson('/api/expenses', [
            'date' => '2026-09-18',
            'expense_account_id' => Account::query()->where('code', '5-11003')->value('id'),
            'cash_account_id' => $this->bank->id,
            'payee' => 'PLN',
            'description' => 'Listrik pabrik September',
            'amount' => '12500000',
        ])->assertCreated()->json('data');

        $this->assertSame('EXP/2026/09/0001', $expense['number']);

        $lines = collect($expense['journal_entry']['lines']);
        $this->assertSame('12500000.00', $lines->firstWhere('account.code', '5-11003')['debit']);
        $this->assertSame('12500000.00', $lines->firstWhere('account.code', '1-10003')['credit']);
        $this->assertSame('kas_bank', $expense['journal_entry']['tagging']);

        $summary = $this->getJson('/api/expenses/summary?from=2026-09-01&to=2026-09-30')->json('data');
        $this->assertSame('12500000.00', $summary['total']);
        $this->assertSame('12500000.00', $summary['production']);
        $this->assertSame('0.00', $summary['operational']);
    }

    public function test_akun_bukan_beban_ditolak(): void
    {
        $this->postJson('/api/expenses', [
            'date' => '2026-09-18',
            'expense_account_id' => Account::query()->where('code', '1-10100')->value('id'),
            'cash_account_id' => $this->bank->id,
            'description' => 'Salah akun',
            'amount' => '1000',
        ])->assertStatus(422);
    }

    public function test_pembatalan_membalik_jurnal(): void
    {
        $expense = $this->postJson('/api/expenses', [
            'date' => '2026-09-18',
            'expense_account_id' => Account::query()->where('code', '6-10012')->value('id'),
            'cash_account_id' => $this->bank->id,
            'description' => 'Admin bank',
            'amount' => '15000',
        ])->assertCreated()->json('data');

        $cancelled = $this->postJson("/api/expenses/{$expense['id']}/cancel")->assertOk()->json('data');
        $this->assertSame('cancelled', $cancelled['status']);

        $this->assertSame(
            '0.00',
            $this->getJson('/api/expenses/summary?from=2026-09-01&to=2026-09-30')->json('data.total'),
        );

        $this->postJson("/api/expenses/{$expense['id']}/cancel")->assertStatus(422);
    }
}
