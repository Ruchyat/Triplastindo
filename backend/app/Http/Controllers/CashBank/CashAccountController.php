<?php

namespace App\Http\Controllers\CashBank;

use App\Http\Controllers\Controller;
use App\Http\Resources\AccountResource;
use App\Models\Account;
use App\Models\JournalLine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/**
 * Posisi dan mutasi akun Kas & Bank.
 *
 * Saldo dihitung dari baris jurnal, sama seperti Buku Besar — tidak ada saldo
 * yang disimpan terpisah. Mutasinya adalah baris jurnal yang menyentuh akun
 * kas, dari modul mana pun ia berasal.
 */
class CashAccountController extends Controller
{
    /** Saldo tiap akun kas/bank aktif per tanggal tertentu (bawaan: hari ini). */
    public function index(Request $request): JsonResponse
    {
        $asOf = $request->filled('as_of') ? Carbon::parse($request->string('as_of')->toString()) : now();

        $sums = JournalLine::query()
            ->whereHas('entry')
            ->whereDate('date', '<=', $asOf)
            ->selectRaw('account_id, SUM(debit) as debit, SUM(credit) as credit')
            ->groupBy('account_id')
            ->get()
            ->keyBy('account_id');

        $accounts = Account::query()
            ->where('is_cash', true)
            ->where('is_active', true)
            ->orderBy('code')
            ->get()
            ->map(function (Account $account) use ($sums) {
                $sum = $sums->get($account->id);

                return [
                    ...(new AccountResource($account))->resolve(),
                    'balance' => bcadd($account->normal_balance->balanceOf($sum->debit ?? '0', $sum->credit ?? '0'), '0', 2),
                ];
            });

        return response()->json([
            'data' => $accounts,
            'meta' => [
                'as_of' => $asOf->toDateString(),
                'total_balance' => $accounts->reduce(fn (string $sum, array $row) => bcadd($sum, $row['balance'], 2), '0.00'),
            ],
        ]);
    }

    /** Mutasi seluruh akun kas/bank dalam satu rentang, terbaru lebih dahulu. */
    public function mutations(Request $request): JsonResponse
    {
        $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'account_id' => ['nullable', 'integer'],
        ]);

        $from = $request->filled('from') ? Carbon::parse($request->string('from')->toString()) : now()->startOfMonth();
        $to = $request->filled('to') ? Carbon::parse($request->string('to')->toString()) : now()->endOfMonth();

        $lines = JournalLine::query()
            ->with(['account', 'entry'])
            ->whereHas('entry')
            ->whereHas('account', fn ($q) => $q->where('is_cash', true))
            ->when($request->filled('account_id'), fn ($q) => $q->where('account_id', $request->integer('account_id')))
            ->whereBetween('date', [$from->toDateString(), $to->toDateString()])
            ->orderByDesc('date')
            ->orderByDesc('journal_entry_id')
            ->orderBy('sort_order')
            ->paginate(min($request->integer('per_page', 50), 200))
            ->withQueryString();

        $rows = $lines->getCollection()->map(fn (JournalLine $line) => [
            'id' => $line->id,
            'date' => $line->date->toDateString(),
            'account' => new AccountResource($line->account),
            'journal_entry_id' => $line->journal_entry_id,
            'journal_number' => $line->entry?->number,
            'source' => $line->entry?->source->value,
            'source_label' => $line->entry?->source->label(),
            'source_number' => $line->entry?->source_number,
            'description' => $line->description ?: $line->entry?->description,
            'debit' => (string) $line->debit,
            'credit' => (string) $line->credit,
        ]);

        // Bentuknya disamakan dengan resource collection lain: `data` + `meta`.
        return response()->json([
            'data' => $rows->values(),
            'meta' => [
                'current_page' => $lines->currentPage(),
                'last_page' => $lines->lastPage(),
                'per_page' => $lines->perPage(),
                'total' => $lines->total(),
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
            ],
        ]);
    }
}
