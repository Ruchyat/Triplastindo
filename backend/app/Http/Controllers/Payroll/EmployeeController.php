<?php

namespace App\Http\Controllers\Payroll;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Employee;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Master karyawan. Tidak dihapus, hanya dinonaktifkan. */
class EmployeeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $employees = Employee::query()
            ->with('expenseAccount')
            ->when($request->has('is_active'), fn ($q) => $q->where('is_active', $request->boolean('is_active')))
            ->orderBy('name')
            ->get()
            ->map(fn (Employee $e) => $this->serialize($e, $request->boolean('with_loan')));

        return response()->json(['data' => $employees]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validate_($request);
        $data['expense_account_id'] ??= $this->defaultAccount($data['department']);

        return response()->json(['data' => $this->serialize(Employee::query()->create($data)->load('expenseAccount'))], 201);
    }

    public function update(Request $request, Employee $employee): JsonResponse
    {
        $data = $this->validate_($request, $employee);
        $data['expense_account_id'] ??= $this->defaultAccount($data['department']);
        $employee->update($data);

        return response()->json(['data' => $this->serialize($employee->load('expenseAccount'))]);
    }

    /** @return array<string, mixed> */
    private function validate_(Request $request, ?Employee $current = null): array
    {
        return $request->validate([
            'nik' => ['required', 'string', 'max:32', Rule::unique('employees', 'nik')->ignore($current)],
            'name' => ['required', 'string', 'max:255'],
            'department' => ['required', Rule::in(array_keys(Employee::DEPARTMENTS))],
            'position' => ['nullable', 'string', 'max:64'],
            'employment_status' => ['required', Rule::in(array_keys(Employee::STATUSES))],
            'joined_at' => ['nullable', 'date'],
            'basic_salary' => ['required', 'numeric', 'min:0'],
            'allowance' => ['nullable', 'numeric', 'min:0'],
            'expense_account_id' => ['nullable', 'integer', Rule::exists('accounts', 'id')],
            'bank_account' => ['nullable', 'string', 'max:64'],
            'is_active' => ['sometimes', 'boolean'],
        ]);
    }

    private function defaultAccount(string $department): int
    {
        return Account::query()->where('code', config("triplastindo.payroll_accounts.{$department}"))->value('id');
    }

    /** @return array<string, mixed> */
    private function serialize(Employee $employee, bool $withLoan = false): array
    {
        return [
            'id' => $employee->id,
            'nik' => $employee->nik,
            'name' => $employee->name,
            'department' => $employee->department,
            'department_label' => Employee::DEPARTMENTS[$employee->department] ?? $employee->department,
            'position' => $employee->position,
            'employment_status' => $employee->employment_status,
            'employment_status_label' => Employee::STATUSES[$employee->employment_status] ?? $employee->employment_status,
            'joined_at' => $employee->joined_at?->toDateString(),
            'basic_salary' => (string) $employee->basic_salary,
            'allowance' => (string) $employee->allowance,
            'expense_account_id' => $employee->expense_account_id,
            'expense_account' => $employee->expenseAccount?->label(),
            'bank_account' => $employee->bank_account,
            'is_active' => $employee->is_active,
            'loan_balance' => $withLoan ? $employee->loanBalance() : null,
        ];
    }
}
