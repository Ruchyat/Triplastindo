<?php

namespace App\Services\Reports;

use App\Enums\DocumentStatus;
use App\Models\Account;
use App\Models\JournalLine;
use App\Models\PurchaseBill;
use App\Models\SalesInvoice;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;

/**
 * Angka-angka tab DASHBOARD di Google Sheet, dirangkai dari laporan yang sama:
 * KPI pendapatan/beban/laba, rasio YTD, saldo kas, ringkasan arus kas, tren
 * bulanan, dan realisasi utang-piutang.
 */
final class DashboardReport
{
    public function __construct(
        private readonly ProfitLossReport $profitLoss = new ProfitLossReport,
        private readonly BalanceSheetReport $balanceSheet = new BalanceSheetReport,
        private readonly CashFlowReport $cashFlow = new CashFlowReport,
        private readonly FinancialRatios $ratios = new FinancialRatios,
    ) {}

    /** @return array<string, mixed> */
    public function build(int $year, int $month): array
    {
        $start = Carbon::create($year, $month, 1)->startOfDay();
        $end = $start->copy()->endOfMonth();
        $yearStart = $start->copy()->startOfYear();
        $previousStart = $start->copy()->subMonth();
        $previousEnd = $previousStart->copy()->endOfMonth();

        $balance = $this->balanceSheet->build($end);
        $ytdProfitLoss = $this->profitLoss->build($yearStart, $end);
        $ytdCashFlow = $this->cashFlow->build($yearStart, $end);

        $monthly = [];
        for ($m = 1; $m <= 12; $m++) {
            $monthStart = Carbon::create($year, $m, 1)->startOfDay();
            $results = $this->profitLoss->build($monthStart, $monthStart->copy()->endOfMonth())['results'];
            $monthly[] = [
                'month' => $m,
                'revenue' => $results['revenue'],
                'expenses' => $results['total_expenses'],
                'net_profit' => $results['net_profit'],
            ];
        }

        $period = $monthly[$month - 1];
        $previous = $previousStart->year === $year
            ? $monthly[$month - 2]
            : $this->kpi($this->profitLoss->build($previousStart, $previousEnd)['results']);

        return [
            'year' => $year,
            'month' => $month,
            'as_of' => $end->toDateString(),
            'period' => $this->summarize($period, $previous, $balance['totals']['total_assets']),
            'ytd' => $this->summarize($this->kpi($ytdProfitLoss['results']), null, $balance['totals']['total_assets']),
            'ratios' => $this->ratios->build($balance, $ytdProfitLoss, $ytdCashFlow),
            'cash' => $this->cashPosition($end),
            'cash_flow_ytd' => $this->cashSummary($ytdCashFlow),
            'monthly' => $monthly,
            'payables' => $this->realization(PurchaseBill::query(), $yearStart, $end),
            'receivables' => $this->realization(SalesInvoice::query(), $yearStart, $end),
        ];
    }

    /** @param  array<string, string>  $results */
    private function kpi(array $results): array
    {
        return [
            'revenue' => $results['revenue'],
            'expenses' => $results['total_expenses'],
            'net_profit' => $results['net_profit'],
        ];
    }

    /**
     * @param  array<string, mixed>  $current
     * @param  array<string, mixed>|null  $previous
     */
    private function summarize(array $current, ?array $previous, string $totalAssets): array
    {
        $ratio = fn (string $a, string $b): ?float => bccomp($b, '0', 2) === 0 ? null : (float) $a / (float) $b;
        $change = fn (string $now, string $before): ?float => bccomp($before, '0', 2) === 0
            ? null
            : ((float) $now - (float) $before) / abs((float) $before);

        return [
            'revenue' => $current['revenue'],
            'expenses' => $current['expenses'],
            'net_profit' => $current['net_profit'],
            'asset_turnover' => $ratio($current['revenue'], $totalAssets),
            'expense_ratio' => $ratio($current['expenses'], $current['revenue']),
            'net_profit_margin' => $ratio($current['net_profit'], $current['revenue']),
            'revenue_change' => $previous ? $change($current['revenue'], $previous['revenue']) : null,
            'expense_change' => $previous ? $change($current['expenses'], $previous['expenses']) : null,
            'profit_change' => $previous ? $change($current['net_profit'], $previous['net_profit']) : null,
        ];
    }

    private function cashPosition(CarbonInterface $asOf): array
    {
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
                    'id' => $account->id,
                    'code' => $account->code,
                    'name' => $account->name,
                    'balance' => bcadd($account->normal_balance->balanceOf($sum->debit ?? '0', $sum->credit ?? '0'), '0', 2),
                ];
            });

        return [
            'as_of' => $asOf->toDateString(),
            'total' => $accounts->reduce(fn (string $sum, array $row) => bcadd($sum, $row['balance'], 2), '0.00'),
            'accounts' => $accounts->values()->all(),
        ];
    }

    /** @param  array<string, mixed>  $cashFlow */
    private function cashSummary(array $cashFlow): array
    {
        $incoming = '0.00';
        $outgoing = '0.00';

        foreach ($cashFlow['activities'] as $activity) {
            foreach ($activity['rows'] as $row) {
                if (bccomp($row['amount'], '0', 2) >= 0) {
                    $incoming = bcadd($incoming, $row['amount'], 2);
                } else {
                    $outgoing = bcsub($outgoing, $row['amount'], 2);
                }
            }
        }

        return [
            'opening' => $cashFlow['summary']['opening_balance'],
            'incoming' => $incoming,
            'outgoing' => $outgoing,
            'closing' => $cashFlow['summary']['closing_balance'],
        ];
    }

    /**
     * Realisasi utang atau piutang YTD: dokumen bertermin yang diposting sejak
     * awal tahun, berapa yang sudah dibayar, dan sisanya.
     *
     * @param  Builder<PurchaseBill|SalesInvoice>  $query
     */
    private function realization($query, CarbonInterface $from, CarbonInterface $to): array
    {
        $scope = fn () => (clone $query)
            ->whereNotIn('status', [DocumentStatus::Draft->value, DocumentStatus::Cancelled->value])
            ->whereDate('date', '>=', $from)
            ->whereDate('date', '<=', $to);

        $total = bcadd((string) ($scope()->sum('total') ?? 0), '0', 2);
        $paid = bcadd((string) ($scope()->sum('paid_amount') ?? 0), '0', 2);

        return [
            'total' => $total,
            'paid' => $paid,
            'outstanding' => bcsub($total, $paid, 2),
            'percentage' => bccomp($total, '0', 2) === 0 ? null : (float) $paid / (float) $total,
        ];
    }
}
