<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Http\Resources\AccountResource;
use App\Models\Account;
use App\Services\Accounting\LedgerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/**
 * Buku Besar dan Neraca Saldo.
 *
 * Rentang tanggalnya wajib: tanpa batas, saldo awal tidak punya arti.
 * Bawaannya bulan berjalan.
 */
class LedgerController extends Controller
{
    public function __construct(private readonly LedgerService $ledger) {}

    /** Neraca saldo: saldo awal, mutasi, dan saldo akhir seluruh akun bergerak. */
    public function index(Request $request): JsonResponse
    {
        [$from, $to] = $this->range($request);

        $rows = array_map(fn (array $row) => [
            ...$row,
            'account' => new AccountResource($row['account']),
        ], $this->ledger->trialBalance($from, $to));

        return response()->json([
            'data' => $rows,
            'meta' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
        ]);
    }

    /** Mutasi dan saldo berjalan satu akun. */
    public function show(Request $request, Account $account): JsonResponse
    {
        [$from, $to] = $this->range($request);

        return response()->json([
            'data' => [
                'account' => new AccountResource($account->load('category')),
                ...$this->ledger->accountLedger($account, $from, $to),
            ],
            'meta' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
        ]);
    }

    /** @return array{0: Carbon, 1: Carbon} */
    private function range(Request $request): array
    {
        $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
        ]);

        $from = $request->filled('from') ? Carbon::parse($request->string('from')->toString()) : now()->startOfMonth();
        $to = $request->filled('to') ? Carbon::parse($request->string('to')->toString()) : now()->endOfMonth();

        return [$from->startOfDay(), $to->endOfDay()];
    }
}
