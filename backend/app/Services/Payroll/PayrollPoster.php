<?php

namespace App\Services\Payroll;

use App\Enums\JournalSource;
use App\Models\Employee;
use App\Models\JournalEntry;
use App\Models\PayrollItem;
use App\Models\PayrollRun;
use App\Models\User;
use App\Services\Accounting\JournalDraft;
use App\Services\Accounting\JournalLineDraft;
use App\Services\Accounting\JournalPoster;
use App\Services\DocumentNumberGenerator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Menyusun, memposting, dan membatalkan payroll bulanan.
 *
 * Draft diisi dari master karyawan (gaji pokok dan allowance), lalu HR
 * melengkapi lembur, bonus, kasbon, dan potongan. Saat diposting:
 *
 *   D  Beban gaji per akun (kotor)        D  Piutang Karyawan (pinjaman kasbon)
 *   K  Hutang PPh 21                       K  Biaya Masih Harus Dibayar (BPJS)
 *   K  Piutang Karyawan (potongan kasbon)  K  Kas/Bank (total THP)
 */
final class PayrollPoster
{
    private const PREFIX = 'PAY';

    public function __construct(
        private readonly JournalPoster $journals = new JournalPoster,
        private readonly DocumentNumberGenerator $numbers = new DocumentNumberGenerator,
    ) {}

    public function createDraft(int $year, int $month, Carbon $paymentDate, int $cashAccountId, User $user): PayrollRun
    {
        if (PayrollRun::query()->where('year', $year)->where('month', $month)->exists()) {
            throw ValidationException::withMessages(['month' => 'Payroll bulan itu sudah ada.']);
        }

        return DB::transaction(function () use ($year, $month, $paymentDate, $cashAccountId, $user) {
            $run = PayrollRun::query()->create([
                'number' => $this->numbers->next(self::PREFIX, $paymentDate, PayrollRun::class),
                'year' => $year,
                'month' => $month,
                'payment_date' => $paymentDate->toDateString(),
                'cash_account_id' => $cashAccountId,
                'status' => 'draft',
                'created_by' => $user->id,
            ]);

            Employee::query()->where('is_active', true)->orderBy('name')->each(function (Employee $employee) use ($run) {
                $item = new PayrollItem([
                    'payroll_run_id' => $run->id,
                    'employee_id' => $employee->id,
                    'basic_salary' => (string) $employee->basic_salary,
                    'allowance' => (string) $employee->allowance,
                ]);
                $item->recalculate()->save();
            });

            return $this->refreshTotals($run);
        });
    }

    /** @param  list<array<string, mixed>>  $items */
    public function updateItems(PayrollRun $run, array $items): PayrollRun
    {
        if (! $run->isDraft()) {
            throw ValidationException::withMessages(['status' => 'Payroll yang sudah diposting tidak dapat diubah.']);
        }

        return DB::transaction(function () use ($run, $items) {
            foreach ($items as $row) {
                $item = $run->items()->where('employee_id', $row['employee_id'])->first()
                    ?? new PayrollItem(['payroll_run_id' => $run->id, 'employee_id' => $row['employee_id']]);

                foreach (PayrollItem::AMOUNT_FIELDS as $field) {
                    if (array_key_exists($field, $row)) {
                        $item->{$field} = bcadd((string) ($row[$field] ?? 0), '0', 2);
                    }
                }
                $item->recalculate()->save();
            }

            return $this->refreshTotals($run);
        });
    }

    public function removeItem(PayrollRun $run, int $employeeId): PayrollRun
    {
        if (! $run->isDraft()) {
            throw ValidationException::withMessages(['status' => 'Payroll yang sudah diposting tidak dapat diubah.']);
        }

        $run->items()->where('employee_id', $employeeId)->delete();

        return $this->refreshTotals($run);
    }

    public function post(PayrollRun $run, User $user): PayrollRun
    {
        if (! $run->isDraft()) {
            throw ValidationException::withMessages(['status' => 'Payroll ini sudah diposting atau dibatalkan.']);
        }

        $run->loadMissing('items.employee.expenseAccount', 'cashAccount');

        if ($run->items->isEmpty()) {
            throw ValidationException::withMessages(['items' => 'Payroll belum memiliki baris karyawan.']);
        }

        return DB::transaction(function () use ($run, $user) {
            $perExpense = [];
            $totals = array_fill_keys(['loan_advance', 'tax_pph21', 'bpjs', 'loan_deduction', 'take_home'], '0.00');

            foreach ($run->items as $item) {
                $code = $item->employee->expenseAccount->code;
                $perExpense[$code] = bcadd($perExpense[$code] ?? '0.00', (string) $item->gross, 2);
                $totals['loan_advance'] = bcadd($totals['loan_advance'], (string) $item->loan_advance, 2);
                $totals['tax_pph21'] = bcadd($totals['tax_pph21'], (string) $item->tax_pph21, 2);
                $totals['bpjs'] = bcadd($totals['bpjs'], bcadd((string) $item->bpjs_employment, (string) $item->bpjs_health, 2), 2);
                $totals['loan_deduction'] = bcadd($totals['loan_deduction'], (string) $item->loan_deduction, 2);
                $totals['take_home'] = bcadd($totals['take_home'], (string) $item->take_home, 2);
            }

            $accounts = config('triplastindo.accounts');
            $period = $run->payment_date->translatedFormat('F Y');
            $debits = [];
            $credits = [];

            foreach ($perExpense as $code => $amount) {
                if (bccomp($amount, '0', 2) > 0) {
                    $debits[] = JournalLineDraft::debit($code, $amount, "Gaji {$period}");
                }
            }
            if (bccomp($totals['loan_advance'], '0', 2) > 0) {
                $debits[] = JournalLineDraft::debit($accounts['employee_receivable'], $totals['loan_advance'], "Pinjaman kasbon {$period}");
            }
            if (bccomp($totals['tax_pph21'], '0', 2) > 0) {
                $credits[] = JournalLineDraft::credit($accounts['pph21_payable'], $totals['tax_pph21'], "PPh 21 {$period}");
            }
            if (bccomp($totals['bpjs'], '0', 2) > 0) {
                $credits[] = JournalLineDraft::credit($accounts['accrued_expense'], $totals['bpjs'], "BPJS dipotong {$period}");
            }
            if (bccomp($totals['loan_deduction'], '0', 2) > 0) {
                $credits[] = JournalLineDraft::credit($accounts['employee_receivable'], $totals['loan_deduction'], "Potongan kasbon {$period}");
            }
            if (bccomp($totals['take_home'], '0', 2) > 0) {
                $credits[] = JournalLineDraft::credit($run->cashAccount->code, $totals['take_home'], "Pembayaran gaji {$period}");
            }

            $entry = $this->journals->post(new JournalDraft(
                date: $run->payment_date,
                description: "Payroll {$run->number} · {$period}",
                lines: [...$debits, ...$credits],
                createdBy: $user->id,
                source: JournalSource::Payroll,
                sourceId: $run->id,
                sourceNumber: $run->number,
                paymentMethod: $run->cashAccount->name,
            ));

            $run->forceFill(['status' => 'posted', 'journal_entry_id' => $entry->id])->save();

            return $run->refresh();
        });
    }

    public function cancel(PayrollRun $run, User $user): PayrollRun
    {
        if ($run->status !== 'posted') {
            throw ValidationException::withMessages(['status' => 'Hanya payroll yang sudah diposting yang dapat dibatalkan.']);
        }

        return DB::transaction(function () use ($run, $user) {
            $original = JournalEntry::query()->with('lines.account')->findOrFail($run->journal_entry_id);
            $debits = [];
            $credits = [];
            foreach ($original->lines as $line) {
                if ($line->isDebit()) {
                    $credits[] = JournalLineDraft::credit($line->account->code, $line->amount(), $line->description);
                } else {
                    $debits[] = JournalLineDraft::debit($line->account->code, $line->amount(), $line->description);
                }
            }

            $this->journals->post(new JournalDraft(
                date: $run->payment_date,
                description: "Pembatalan {$run->number}",
                lines: [...$debits, ...$credits],
                createdBy: $user->id,
                source: JournalSource::Payroll,
                sourceId: $run->id,
                sourceNumber: $run->number,
            ));

            $run->forceFill(['status' => 'cancelled'])->save();

            return $run->refresh();
        });
    }

    private function refreshTotals(PayrollRun $run): PayrollRun
    {
        $sums = $run->items()->selectRaw('COALESCE(SUM(gross),0) as g, COALESCE(SUM(net),0) as n, COALESCE(SUM(take_home),0) as t')->first();
        $run->forceFill([
            'total_gross' => (string) $sums->g,
            'total_net' => (string) $sums->n,
            'total_take_home' => (string) $sums->t,
        ])->save();

        return $run->refresh();
    }
}
