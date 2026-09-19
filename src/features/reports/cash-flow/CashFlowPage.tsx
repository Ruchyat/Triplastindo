import { useCallback } from 'react'
import { Card, InfoNote, MiniStat, PageHeader } from '@/components/common'
import { useAsync } from '@/hooks/useAsync'
import { formatCurrency, toAmount } from '@/lib'
import { reportService } from '@/services/reportService'
import { ReportControls } from '../components/ReportControls'
import { useReportPeriod } from '../useReportPeriod'
import { CashFlowReport } from './components/CashFlowReport'

/** Laporan Arus Kas metode langsung, bulan terpilih atau YTD. */
export function CashFlowPage() {
  const state = useReportPeriod()
  const { year, month } = state

  const load = useCallback(() => reportService.cashFlow({ year, month }), [year, month])
  const { data, error, isLoading } = useAsync(load)

  const report = data ? (state.ytd ? data.ytd : data.period) : null
  const summary = report?.summary

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Laporan / Arus Kas"
        title="Laporan Arus Kas"
        description="Pergerakan kas dari aktivitas operasi, investasi, dan pendanaan"
      />
      <ReportControls state={state} />

      {error && <InfoNote tone="red">{error}</InfoNote>}

      <div className="grid gap-3 sm:grid-cols-3">
        <MiniStat label="Kas Bersih Operasi" value={toAmount(summary?.net_operating)} tone="green" />
        <MiniStat label="Kenaikan / (Penurunan) Kas" value={toAmount(summary?.net_change)} />
        <MiniStat label="Saldo Kas Akhir" value={toAmount(summary?.closing_balance)} />
      </div>

      {report && data ? (
        <>
          <CashFlowReport report={report} periodLabel={state.rangeLabel} />
          <ReconciliationCard
            cashFlowClosing={toAmount(summary?.closing_balance)}
            balanceSheetCash={toAmount(data.balance_sheet_cash)}
          />
        </>
      ) : (
        isLoading && <p className="text-xs text-slate-500">Memuat laporan...</p>
      )}
    </div>
  )
}

/**
 * Rekonsiliasi saldo kas.
 *
 * Saldo akhir Arus Kas wajib sama dengan saldo akun Kas & Bank pada Neraca;
 * selisihnya ditampilkan agar ketidakcocokan langsung terlihat.
 */
function ReconciliationCard({ cashFlowClosing, balanceSheetCash }: { cashFlowClosing: number; balanceSheetCash: number }) {
  const difference = Math.round((cashFlowClosing - balanceSheetCash) * 100) / 100
  const balanced = difference === 0

  return (
    <Card className="p-5">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Rekonsiliasi Saldo Kas</h2>
          <p className="mt-1 text-xs text-slate-500">
            Memastikan saldo arus kas sesuai dengan laporan neraca
          </p>
        </div>
        <div className="grid flex-1 gap-3 sm:grid-cols-3 md:max-w-2xl">
          <MiniStat label="Menurut Arus Kas" value={cashFlowClosing} />
          <MiniStat label="Menurut Neraca" value={balanceSheetCash} />
          <MiniStat label="Selisih" value={formatCurrency(difference)} tone={balanced ? 'green' : 'red'} />
        </div>
      </div>
    </Card>
  )
}
