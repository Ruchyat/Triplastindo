import { Card, MiniStat, PageHeader } from '@/components/common'
import { formatCurrency } from '@/lib'
import { cashFlowSummary } from '@/mocks/reports'
import { ReportControls } from '../components/ReportControls'
import { CashFlowReport } from './components/CashFlowReport'

export function CashFlowPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Laporan / Arus Kas"
        title="Laporan Arus Kas"
        description="Pergerakan kas dari aktivitas operasi, investasi, dan pendanaan"
      />
      <ReportControls />

      <div className="grid gap-3 sm:grid-cols-3">
        <MiniStat label="Kas Bersih Operasi" value={cashFlowSummary.netOperating} tone="green" />
        <MiniStat label="Kenaikan Kas Bersih" value={cashFlowSummary.netChange} />
        <MiniStat label="Saldo Kas Akhir" value={cashFlowSummary.closingBalance} />
      </div>

      <CashFlowReport />
      <ReconciliationCard />
    </div>
  )
}

/**
 * Rekonsiliasi saldo kas.
 *
 * Saldo akhir Arus Kas wajib sama dengan saldo akun Kas & Bank pada Neraca;
 * selisihnya ditampilkan agar ketidakcocokan langsung terlihat.
 */
function ReconciliationCard() {
  const balanced = cashFlowSummary.difference === 0

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
          <MiniStat label="Menurut Arus Kas" value={cashFlowSummary.closingBalance} />
          <MiniStat label="Menurut Neraca" value={cashFlowSummary.balanceSheetCash} />
          <MiniStat
            label="Selisih"
            value={formatCurrency(cashFlowSummary.difference)}
            tone={balanced ? 'green' : 'red'}
          />
        </div>
      </div>
    </Card>
  )
}
