<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Services\Reports\BalanceSheetReport;
use App\Services\Reports\CashFlowReport;
use App\Services\Reports\FinancialRatios;
use App\Services\Reports\ProfitLossReport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/**
 * Laporan keuangan.
 *
 * Semua laporan menerima `year` dan `month`; bawaannya bulan berjalan. Laba
 * Rugi dan Arus Kas dikembalikan dua kolom sekaligus — bulan itu dan YTD —
 * persis susunan di Google Sheet. Neraca selalu per akhir bulan itu.
 */
class ReportController extends Controller
{
    public function __construct(
        private readonly ProfitLossReport $profitLoss,
        private readonly BalanceSheetReport $balanceSheet,
        private readonly CashFlowReport $cashFlow,
        private readonly FinancialRatios $ratios,
    ) {}

    public function profitLoss(Request $request): JsonResponse
    {
        [$start, $end, $yearStart] = $this->period($request);

        return response()->json([
            'data' => [
                'period' => $this->profitLoss->build($start, $end),
                'ytd' => $this->profitLoss->build($yearStart, $end),
            ],
        ]);
    }

    public function balanceSheet(Request $request): JsonResponse
    {
        [, $end, $yearStart] = $this->period($request);

        $balance = $this->balanceSheet->build($end);
        $ytdProfitLoss = $this->profitLoss->build($yearStart, $end);
        $ytdCashFlow = $this->cashFlow->build($yearStart, $end);

        return response()->json([
            'data' => [
                ...$balance,
                'ratios' => $this->ratios->build($balance, $ytdProfitLoss, $ytdCashFlow),
            ],
        ]);
    }

    public function cashFlow(Request $request): JsonResponse
    {
        [$start, $end, $yearStart] = $this->period($request);

        return response()->json([
            'data' => [
                'period' => $this->cashFlow->build($start, $end),
                'ytd' => $this->cashFlow->build($yearStart, $end),
                'balance_sheet_cash' => $this->balanceSheet->build($end)['totals']['cash'],
            ],
        ]);
    }

    /** @return array{0: Carbon, 1: Carbon, 2: Carbon} awal bulan, akhir bulan, awal tahun */
    private function period(Request $request): array
    {
        $request->validate([
            'year' => ['nullable', 'integer', 'min:2000', 'max:2100'],
            'month' => ['nullable', 'integer', 'min:1', 'max:12'],
        ]);

        $year = $request->integer('year') ?: now()->year;
        $month = $request->integer('month') ?: now()->month;

        $start = Carbon::create($year, $month, 1)->startOfDay();

        return [$start, $start->copy()->endOfMonth(), $start->copy()->startOfYear()];
    }
}
