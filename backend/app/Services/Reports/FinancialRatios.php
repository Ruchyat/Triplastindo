<?php

namespace App\Services\Reports;

use App\Models\Setting;

/**
 * Rasio keuangan beserta standar yang dipakai di tab RASIO-RASIO KEUANGAN sheet.
 *
 * Standarnya dari pengaturan (bawaan mengikuti sheet); verdict `good`/`bad`
 * mengikuti arah rasionya — DER dianggap baik bila di bawah standar, sisanya
 * bila di atas.
 */
final class FinancialRatios
{
    /**
     * @param  array<string, mixed>  $balanceSheet  hasil BalanceSheetReport
     * @param  array<string, mixed>  $profitLoss  hasil ProfitLossReport (YTD)
     * @param  array<string, mixed>  $cashFlow  hasil CashFlowReport (YTD)
     * @return list<array<string, mixed>>
     */
    public function build(array $balanceSheet, array $profitLoss, array $cashFlow): array
    {
        $t = $balanceSheet['totals'];
        $r = $profitLoss['results'];

        $ratio = fn (string $a, string $b): ?float => bccomp($b, '0', 2) === 0 ? null : (float) $a / (float) $b;

        $quickAssets = bcsub($t['current_assets'], $t['inventory'], 2);
        $standard = Setting::get('ratio_standards');

        return [
            $this->row('current_ratio', 'Current Ratio', $ratio($t['current_assets'], $t['current_liabilities']), (float) $standard['current_ratio'], 'min', 'number', 'Kemampuan bayar utang jangka pendek memakai aset lancar'),
            $this->row('quick_ratio', 'Quick Ratio', $ratio($quickAssets, $t['current_liabilities']), (float) $standard['quick_ratio'], 'min', 'number', 'Kemampuan bayar utang tanpa mengandalkan persediaan'),
            $this->row('gross_profit_margin', 'Gross Profit Margin', $ratio($r['gross_profit'], $r['revenue']), (float) $standard['gross_profit_margin'], 'min', 'percent', 'Persentase laba kotor dari pendapatan'),
            $this->row('net_profit_margin', 'Net Profit Margin', $ratio($r['net_profit'], $r['revenue']), (float) $standard['net_profit_margin'], 'min', 'percent', 'Persentase laba bersih dari pendapatan'),
            $this->row('debt_to_equity', 'Debt to Equity Ratio', $ratio($t['liabilities'], $t['equity']), (float) $standard['debt_to_equity'], 'max', 'number', 'Perbandingan utang dengan modal'),
            $this->row('cashflow_to_revenue', 'Cashflow to Revenue', $ratio($cashFlow['summary']['net_operating'], $r['revenue']), (float) $standard['cashflow_to_revenue'], 'min', 'percent', 'Kemampuan pendapatan menghasilkan kas'),
            $this->row('asset_turnover', 'Asset Turnover', $ratio($r['revenue'], $t['total_assets']), null, 'min', 'number', 'Pendapatan yang dihasilkan tiap rupiah aset'),
        ];
    }

    /** @return array<string, mixed> */
    private function row(string $key, string $name, ?float $value, ?float $standard, string $direction, string $format, string $hint): array
    {
        $verdict = 'info';
        if ($value !== null && $standard !== null) {
            $verdict = ($direction === 'min' ? $value >= $standard : $value <= $standard) ? 'good' : 'bad';
        }

        return [
            'key' => $key,
            'name' => $name,
            'value' => $value,
            'standard' => $standard,
            'direction' => $direction,
            'format' => $format,
            'verdict' => $verdict,
            'hint' => $hint,
        ];
    }
}
