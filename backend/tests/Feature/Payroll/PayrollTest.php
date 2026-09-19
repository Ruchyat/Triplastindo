<?php

namespace Tests\Feature\Payroll;

use App\Enums\UserRole;
use App\Models\Account;
use App\Models\User;
use Database\Seeders\ChartOfAccountSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Payroll: rumus sheet, jurnal per departemen, kasbon ke piutang karyawan. */
class PayrollTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(ChartOfAccountSeeder::class);
        Sanctum::actingAs(User::factory()->role(UserRole::Hr)->create());
    }

    public function test_payroll_dari_draft_sampai_posting(): void
    {
        $operator = $this->postJson('/api/employees', [
            'nik' => 'EMP-001', 'name' => 'Jawad', 'department' => 'produksi', 'position' => 'Operator',
            'employment_status' => 'tetap', 'basic_salary' => '4000000', 'allowance' => '500000',
        ])->assertCreated()->json('data');
        $this->assertStringContainsString('5-11000', $operator['expense_account']);

        $staff = $this->postJson('/api/employees', [
            'nik' => 'EMP-002', 'name' => 'Wilson', 'department' => 'kantor', 'position' => 'Staff',
            'employment_status' => 'tetap', 'basic_salary' => '6000000',
        ])->assertCreated()->json('data');

        $run = $this->postJson('/api/payroll-runs', [
            'year' => 2026, 'month' => 9, 'payment_date' => '2026-09-25',
            'cash_account_id' => Account::query()->where('code', '1-10003')->value('id'),
        ])->assertCreated()->json('data');

        $this->assertSame('draft', $run['status']);
        $this->assertCount(2, $run['items']);
        $this->assertSame('10500000.00', $run['total_gross']);

        $run = $this->putJson("/api/payroll-runs/{$run['id']}/items", ['items' => [
            ['employee_id' => $operator['id'], 'overtime' => '300000', 'loan_advance' => '1000000', 'bpjs_health' => '50000'],
            ['employee_id' => $staff['id'], 'tax_pph21' => '100000', 'loan_deduction' => '200000'],
        ]])->assertOk()->json('data');

        $items = collect($run['items'])->keyBy('employee_id');
        // Operator: kotor 4.800.000; bersih 4.750.000; THP 5.750.000 (+ kasbon).
        $this->assertSame('4800000.00', $items[$operator['id']]['gross']);
        $this->assertSame('5750000.00', $items[$operator['id']]['take_home']);
        // Staff: kotor 6.000.000; bersih 5.900.000; THP 5.700.000 (− potongan kasbon).
        $this->assertSame('5700000.00', $items[$staff['id']]['take_home']);

        $posted = $this->postJson("/api/payroll-runs/{$run['id']}/post")->assertOk()->json('data');
        $this->assertSame('posted', $posted['status']);

        $lines = collect($posted['journal_entry']['lines']);
        $this->assertSame('4800000.00', $lines->firstWhere('account.code', '5-11000')['debit']);
        $this->assertSame('6000000.00', $lines->firstWhere('account.code', '6-10001')['debit']);
        $this->assertSame('1000000.00', $lines->firstWhere(fn ($l) => $l['account']['code'] === '1-10103' && $l['debit'] !== '0.00')['debit']);
        $this->assertSame('100000.00', $lines->firstWhere('account.code', '2-10101')['credit']);
        $this->assertSame('11450000.00', $lines->firstWhere('account.code', '1-10003')['credit']);

        $summary = $this->getJson('/api/payroll-runs/summary?year=2026')->json('data.employees');
        $this->assertSame('1000000.00', collect($summary)->firstWhere('employee_id', $operator['id'])['loan_balance']);

        $this->putJson("/api/payroll-runs/{$run['id']}/items", ['items' => [['employee_id' => $staff['id'], 'bonus' => '1']]])->assertStatus(422);
    }
}
