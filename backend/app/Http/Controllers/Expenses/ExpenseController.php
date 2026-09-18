<?php

namespace App\Http\Controllers\Expenses;

use App\Enums\ReceiptStatus;
use App\Exceptions\ExpenseException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Expenses\StoreExpenseRequest;
use App\Http\Resources\ExpenseResource;
use App\Models\Expense;
use App\Services\Expenses\ExpenseData;
use App\Services\Expenses\ExpensePoster;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/** Pengeluaran biaya. Aturannya ada di ExpensePoster. */
class ExpenseController extends Controller
{
    public function __construct(private readonly ExpensePoster $poster) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $expenses = Expense::query()
            ->with(['expenseAccount.category', 'cashAccount'])
            ->tap(fn ($query) => $this->applyFilters($query, $request))
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->paginate(min($request->integer('per_page', 25), 100))
            ->withQueryString();

        return ExpenseResource::collection($expenses);
    }

    /** Total pengeluaran untuk filter yang sama, dipisah HPP dan beban operasional. */
    public function summary(Request $request): JsonResponse
    {
        $scope = fn () => Expense::query()
            ->where('status', ReceiptStatus::Posted)
            ->tap(fn ($query) => $this->applyFilters($query, $request));

        $byGroup = fn (string $group) => $scope()
            ->whereHas('expenseAccount.category', fn ($q) => $q->where('group', $group))
            ->sum('amount');

        return response()->json([
            'data' => [
                'total' => $this->money($scope()->sum('amount')),
                'production' => $this->money($byGroup('hpp')),
                'operational' => $this->money($byGroup('beban')),
                'count' => $scope()->count(),
            ],
        ]);
    }

    /** @throws ExpenseException */
    public function store(StoreExpenseRequest $request): JsonResponse
    {
        $expense = $this->poster->create(ExpenseData::fromRequest($request->validated()), $request->user());

        return (new ExpenseResource($this->loadDetail($expense)))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Expense $expense): ExpenseResource
    {
        return new ExpenseResource($this->loadDetail($expense));
    }

    /** @throws ExpenseException */
    public function cancel(Request $request, Expense $expense): ExpenseResource
    {
        return new ExpenseResource($this->loadDetail($this->poster->cancel($expense, $request->user())));
    }

    /** @param  Builder<Expense>  $query */
    private function applyFilters(Builder $query, Request $request): void
    {
        $search = $request->string('search')->toString();

        $query
            ->when($request->filled('from') && $request->filled('to'), fn ($q) => $q->between(
                $request->string('from')->toString(),
                $request->string('to')->toString(),
            ))
            ->when($request->filled('expense_account_id'), fn ($q) => $q->where('expense_account_id', $request->integer('expense_account_id')))
            ->when($request->filled('cash_account_id'), fn ($q) => $q->where('cash_account_id', $request->integer('cash_account_id')))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')->toString()))
            ->when($search !== '', fn ($q) => $q->where(
                fn ($inner) => $inner->where('number', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('payee', 'like', "%{$search}%")
                    ->orWhere('reference', 'like', "%{$search}%"),
            ));
    }

    private function loadDetail(Expense $expense): Expense
    {
        return $expense->load(['expenseAccount.category', 'cashAccount', 'creator', 'journalEntry.lines.account']);
    }
}
