import { useCallback } from 'react'
import { InfoNote, MiniStat, PageHeader } from '@/components/common'
import { useAsync } from '@/hooks/useAsync'
import { formatCurrency, toAmount } from '@/lib'
import { reportService } from '@/services/reportService'
import { ReportControls } from '../components/ReportControls'
import { useReportPeriod } from '../useReportPeriod'
import { BalanceSheetReport } from './components/BalanceSheetReport'
import { RatioTable } from './components/RatioTable'

/** Laporan Neraca per akhir bulan terpilih, beserta rasio keuangan YTD-nya. */
export function BalanceSheetPage() {
  const state = useReportPeriod()
  const { year, month } = state

  const load = useCallback(() => reportService.balanceSheet({ year, month }), [year, month])
  const { data: report, error, isLoading } = useAsync(load)

  const difference = toAmount(report?.totals.difference)
  const balanced = difference === 0

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Laporan / Neraca"
        title="Laporan Neraca"
        description="Posisi aset, liabilitas, dan ekuitas perusahaan"
      />
      <ReportControls state={state} showYtd={false} />

      {error && <InfoNote tone="red">{error}</InfoNote>}

      <div className="grid gap-3 sm:grid-cols-3">
        <MiniStat label="Total Aset" value={toAmount(report?.totals.total_assets)} />
        <MiniStat label="Liabilitas + Ekuitas" value={toAmount(report?.totals.total_liabilities_equity)} />
        <MiniStat
          label="Status Neraca"
          value={report ? (balanced ? 'BALANCE' : 'TIDAK BALANCE') : '–'}
          tone={balanced ? 'green' : 'red'}
          hint={report ? `Selisih ${formatCurrency(difference)}` : undefined}
        />
      </div>

      {report ? (
        <>
          <BalanceSheetReport report={report} periodLabel={state.endLabel} />
          <RatioTable ratios={report.ratios} />
        </>
      ) : (
        isLoading && <p className="text-xs text-slate-500">Memuat laporan...</p>
      )}
    </div>
  )
}
