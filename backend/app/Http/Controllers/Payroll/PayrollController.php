<?php

namespace App\Http\Controllers\Payroll;

use App\Http\Controllers\Controller;
use App\Http\Resources\PayrollRunResource;
use App\Models\Employee;
use App\Models\PayrollItem;
use App\Models\PayrollRun;
use App\Services\Payroll\PayrollPoster;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

/** Payroll bulanan dan slip gaji. */
class PayrollController extends Controller
{
    public function __construct(private readonly PayrollPoster $poster) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        return PayrollRunResource::collection(
            PayrollRun::query()
                ->with('cashAccount')
                ->withCount('items')
                ->when($request->filled('year'), fn ($q) => $q->where('year', $request->integer('year')))
                ->orderByDesc('year')->orderByDesc('month')
                ->get()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'year' => ['required', 'integer', 'min:2000', 'max:2100'],
            'month' => ['required', 'integer', 'min:1', 'max:12'],
            'payment_date' => ['required', 'date'],
            'cash_account_id' => ['required', 'integer', Rule::exists('accounts', 'id')->where('is_cash', true)],
        ]);

        $run = $this->poster->createDraft((int) $data['year'], (int) $data['month'], Carbon::parse($data['payment_date']), (int) $data['cash_account_id'], $request->user());

        return (new PayrollRunResource($this->load($run)))->response()->setStatusCode(201);
    }

    public function show(PayrollRun $payrollRun): PayrollRunResource
    {
        return new PayrollRunResource($this->load($payrollRun));
    }

    public function updateItems(Request $request, PayrollRun $payrollRun): PayrollRunResource
    {
        $data = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.employee_id' => ['required', 'integer', Rule::exists('employees', 'id')],
            ...collect(PayrollItem::AMOUNT_FIELDS)->mapWithKeys(fn ($f) => ["items.*.{$f}" => ['nullable', 'numeric', 'min:0']])->all(),
        ]);

        return new PayrollRunResource($this->load($this->poster->updateItems($payrollRun, $data['items'])));
    }

    public function removeItem(PayrollRun $payrollRun, Employee $employee): PayrollRunResource
    {
        return new PayrollRunResource($this->load($this->poster->removeItem($payrollRun, $employee->id)));
    }

    public function post(Request $request, PayrollRun $payrollRun): PayrollRunResource
    {
        return new PayrollRunResource($this->load($this->poster->post($payrollRun, $request->user())));
    }

    public function cancel(Request $request, PayrollRun $payrollRun): PayrollRunResource
    {
        return new PayrollRunResource($this->load($this->poster->cancel($payrollRun, $request->user())));
    }

    /** Rekap per karyawan sepanjang tahun: kotor, bersih, THP, dan mutasi kasbon. */
    public function summary(Request $request): JsonResponse
    {
        $year = $request->integer('year') ?: now()->year;

        $rows = PayrollItem::query()
            ->with('employee')
            ->whereHas('run', fn ($q) => $q->where('year', $year)->where('status', 'posted'))
            ->get()
            ->groupBy('employee_id')
            ->map(function ($items) {
                $sum = fn (string $f) => $items->reduce(fn (string $s, PayrollItem $i) => bcadd($s, (string) $i->{$f}, 2), '0.00');
                $employee = $items->first()->employee;

                return [
                    'employee_id' => $employee->id,
                    'name' => $employee->name,
                    'department_label' => Employee::DEPARTMENTS[$employee->department] ?? $employee->department,
                    'months' => $items->count(),
                    'gross' => $sum('gross'),
                    'net' => $sum('net'),
                    'take_home' => $sum('take_home'),
                    'loan_advance' => $sum('loan_advance'),
                    'loan_deduction' => $sum('loan_deduction'),
                    'loan_balance' => $employee->loanBalance(),
                ];
            })
            ->sortBy('name')
            ->values();

        return response()->json(['data' => ['year' => $year, 'employees' => $rows]]);
    }

    private function load(PayrollRun $run): PayrollRun
    {
        return $run->load(['cashAccount', 'creator', 'items.employee', 'journalEntry.lines.account']);
    }
}
