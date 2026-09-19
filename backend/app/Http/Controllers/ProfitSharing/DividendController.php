<?php

namespace App\Http\Controllers\ProfitSharing;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Resources\DividendDecisionResource;
use App\Models\DividendDecision;
use App\Models\Shareholder;
use App\Services\ProfitSharing\DividendService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

/** Bagi hasil: check point bulanan, pengajuan, dan persetujuan dividen. */
class DividendController extends Controller
{
    public function __construct(private readonly DividendService $dividends) {}

    /** Tabel check point 12 bulan beserta keputusan yang ada. */
    public function checkpoints(Request $request): JsonResponse
    {
        $year = $request->integer('year') ?: now()->year;
        $decisions = DividendDecision::query()
            ->where('year', $year)
            ->whereNot('status', 'cancelled')
            ->get()
            ->keyBy('month');

        $months = collect(range(1, 12))->map(function (int $month) use ($year, $decisions) {
            $checkpoint = $this->dividends->checkpoint($year, $month);
            $decision = $decisions->get($month);
            $distributed = $decision ? (string) $decision->total_amount : '0.00';

            return [
                ...$checkpoint,
                'quarter' => 'Q'.intdiv($month - 1, 3) + 1,
                'decision_id' => $decision?->id,
                'decision_status' => $decision?->status,
                'decision_date' => $decision?->decision_date->toDateString(),
                'distributed' => $distributed,
                'retained' => bcsub($checkpoint['net_profit'], $distributed, 2),
                'payout_ratio' => bccomp($checkpoint['net_profit'], '0', 2) > 0
                    ? (float) $distributed / (float) $checkpoint['net_profit']
                    : null,
            ];
        });

        return response()->json(['data' => ['year' => $year, 'months' => $months]]);
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();

        $decisions = DividendDecision::query()
            ->with(['cashAccount', 'allocations.shareholder', 'proposer', 'approver'])
            ->when($request->filled('year'), fn ($q) => $q->where('year', $request->integer('year')))
            ->orderByDesc('decision_date')
            ->get();

        // Pemegang saham hanya melihat bagiannya sendiri.
        if ($user->role === UserRole::Viewer) {
            $shareholderId = Shareholder::query()->where('user_id', $user->id)->value('id');
            $decisions->each(fn (DividendDecision $d) => $d->setRelation(
                'allocations',
                $d->allocations->where('shareholder_id', $shareholderId)->values(),
            ));
        }

        return DividendDecisionResource::collection($decisions);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'year' => ['required', 'integer', 'min:2000', 'max:2100'],
            'month' => ['required', 'integer', 'min:1', 'max:12'],
            'decision_date' => ['required', 'date'],
            'total_amount' => ['required', 'numeric', 'gt:0'],
            'tax_rate' => ['nullable', 'numeric', 'min:0', 'max:1'],
            'cash_account_id' => ['required', 'integer', Rule::exists('accounts', 'id')->where('is_cash', true)],
            'note' => ['nullable', 'string', 'max:255'],
        ]);

        $decision = $this->dividends->propose($data, $request->user());

        return (new DividendDecisionResource($this->load($decision)))->response()->setStatusCode(201);
    }

    public function show(DividendDecision $dividendDecision): DividendDecisionResource
    {
        return new DividendDecisionResource($this->load($dividendDecision));
    }

    public function approve(Request $request, DividendDecision $dividendDecision): DividendDecisionResource
    {
        return new DividendDecisionResource($this->load($this->dividends->approve($dividendDecision, $request->user())));
    }

    public function cancel(Request $request, DividendDecision $dividendDecision): DividendDecisionResource
    {
        return new DividendDecisionResource($this->load($this->dividends->cancel($dividendDecision, $request->user())));
    }

    private function load(DividendDecision $decision): DividendDecision
    {
        return $decision->load(['cashAccount', 'allocations.shareholder', 'proposer', 'approver', 'journalEntry.lines.account']);
    }
}
