import { useState } from 'react'
import { PageHeader } from '@/components/common'
import { TabSwitch, type TabOption } from '@/components/ui/TabSwitch'
import { ReportControls } from '../components/ReportControls'
import { HppPerKgPanel } from './components/HppPerKgPanel'
import { ProfitLossReport } from './components/ProfitLossReport'

type ProfitLossTab = 'report' | 'hpp'

const tabs: TabOption<ProfitLossTab>[] = [
  { value: 'report', label: 'Laba Rugi' },
  { value: 'hpp', label: 'HPP per Kg' },
]

export function ProfitLossPage() {
  const [tab, setTab] = useState<ProfitLossTab>('report')

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Laporan / Laba Rugi"
        title="Laporan Laba Rugi"
        description="Kinerja pendapatan dan beban perusahaan"
      />
      <ReportControls />
      <TabSwitch options={tabs} value={tab} onChange={setTab} />
      {tab === 'report' ? <ProfitLossReport /> : <HppPerKgPanel />}
    </div>
  )
}
