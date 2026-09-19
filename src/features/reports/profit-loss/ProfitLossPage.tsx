import { useCallback } from 'react'
import { InfoNote, MiniStat, PageHeader } from '@/components/common'
import { useAsync } from '@/hooks/useAsync'
import { formatRatioPercent, toAmount } from '@/lib'
import { reportService } from '@/services/reportService'
import { ReportControls } from '../components/ReportControls'
import { useReportPeriod } from '../useReportPeriod'
import { ProfitLossReport } from './components/ProfitLossReport'

/**
 * Laporan Laba Rugi.
 *
 * Panel HPP per Kg dari sheet belum ada di sini: ia membutuhkan tonase
 * produksi dari modul Inventory, yang menyusul.
 */
export function ProfitLossPage() {
  const state = useReportPeriod()
  const { year, month } = state

  const load = useCallback(() => reportService.profitLoss({ year, month }), [year, month])
  const { data, error, isLoading } = useAsync(load)

  const report = data ? (state.ytd ? data.ytd : data.period) : null
  const results = report?.results

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Laporan / Laba Rugi"
        title="Laporan Laba Rugi"
        description="Kinerja pendapatan dan beban perusahaan"
      />
      <ReportControls state={state} />

      {error && <InfoNote tone="red">{error}</InfoNote>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Pendapatan" value={toAmount(results?.revenue)} />
        <MiniStat label="Laba Kotor" value={toAmount(results?.gross_profit)} tone="green"
          hint={results ? `${formatRatioPercent(toAmount(results.gross_profit), toAmount(results.revenue))} dari pendapatan` : undefined} />
        <MiniStat label="Total Beban" value={toAmount(results?.total_expenses)} tone="amber" />
        <MiniStat label="Laba Bersih" value={toAmount(results?.net_profit)} tone={toAmount(results?.net_profit) < 0 ? 'red' : 'blue'}
          hint={results ? `${formatRatioPercent(toAmount(results.net_profit), toAmount(results.revenue))} dari pendapatan` : undefined} />
      </div>

      {report ? (
        <ProfitLossReport report={report} periodLabel={state.rangeLabel} />
      ) : (
        isLoading && <p className="text-xs text-slate-500">Memuat laporan...</p>
      )}
    </div>
  )
}
