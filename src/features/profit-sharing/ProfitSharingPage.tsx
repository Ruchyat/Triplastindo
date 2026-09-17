import { useState } from 'react'
import { PageHeader } from '@/components/common'
import { TabSwitch, type TabOption } from '@/components/ui/TabSwitch'
import { DividendDecisionTab } from './components/DividendDecisionTab'
import { DividendHistoryTab, ShareholderListTab } from './components/ShareholderTabs'

type ProfitSharingTab = 'decision' | 'shareholders' | 'history'

const tabs: TabOption<ProfitSharingTab>[] = [
  { value: 'decision', label: 'Keputusan Pembagian' },
  { value: 'shareholders', label: 'Pemegang Saham' },
  { value: 'history', label: 'Riwayat Dividen' },
]

export function ProfitSharingPage() {
  const [tab, setTab] = useState<ProfitSharingTab>('decision')

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Keuangan / Bagi Hasil"
        title="Bagi Hasil & Dividen"
        description="Kelola keputusan pembagian laba kepada pemegang saham"
      />

      <TabSwitch options={tabs} value={tab} onChange={setTab} />

      {tab === 'decision' && <DividendDecisionTab />}
      {tab === 'shareholders' && <ShareholderListTab />}
      {tab === 'history' && <DividendHistoryTab />}
    </div>
  )
}
