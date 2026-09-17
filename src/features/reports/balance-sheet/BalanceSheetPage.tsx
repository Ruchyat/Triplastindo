import { MiniStat, PageHeader } from '@/components/common'
import { formatCurrency } from '@/lib'
import { balanceSheetSummary } from '@/mocks/reports'
import { ReportControls } from '../components/ReportControls'
import { BalanceSheetReport } from './components/BalanceSheetReport'
import { RatioTable } from './components/RatioTable'

export function BalanceSheetPage() {
  const balanced = balanceSheetSummary.difference === 0

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Laporan / Neraca"
        title="Laporan Neraca"
        description="Posisi aset, liabilitas, dan ekuitas perusahaan"
      />
      <ReportControls />

      <div className="grid gap-3 sm:grid-cols-3">
        <MiniStat label="Total Aset" value={balanceSheetSummary.totalAssets} />
        <MiniStat
          label="Liabilitas + Ekuitas"
          value={balanceSheetSummary.totalLiabilitiesAndEquity}
        />
        <MiniStat
          label="Status Neraca"
          value={balanced ? 'BALANCE' : 'TIDAK BALANCE'}
          tone={balanced ? 'green' : 'red'}
          hint={`Selisih ${formatCurrency(balanceSheetSummary.difference)}`}
        />
      </div>

      <BalanceSheetReport />
      <RatioTable />
    </div>
  )
}
