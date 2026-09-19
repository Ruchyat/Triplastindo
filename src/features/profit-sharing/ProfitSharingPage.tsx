import { useCallback, useState } from 'react'
import { Combobox, InfoNote, PageHeader } from '@/components/common'
import { TabSwitch, type TabOption } from '@/components/ui/TabSwitch'
import { usePermissions } from '@/features/auth/usePermissions'
import { useAsync } from '@/hooks/useAsync'
import { dividendService } from '@/services/dividendService'
import { CheckpointTab } from './components/CheckpointTab'
import { DecisionsTab } from './components/DecisionsTab'

type Tab = 'checkpoint' | 'decisions'

const tabs: TabOption<Tab>[] = [
  { value: 'checkpoint', label: 'Laba & Check Point' },
  { value: 'decisions', label: 'Pengajuan & Riwayat Dividen' },
]

/**
 * Bagi hasil, mengikuti tab BAGI HASIL: check point kas bulanan, pengajuan
 * dividen oleh Finance, persetujuan oleh Direksi. Pemegang saham (Viewer)
 * hanya melihat bagiannya sendiri pada riwayat.
 */
export function ProfitSharingPage() {
  const permissions = usePermissions()
  const canSeeCheckpoints = permissions.can('ledger')
  const [tab, setTab] = useState<Tab>(canSeeCheckpoints ? 'checkpoint' : 'decisions')
  const [year, setYear] = useState(new Date().getFullYear())

  const loadDecisions = useCallback(() => dividendService.list(year), [year])
  const decisions = useAsync(loadDecisions)
  const years = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - 3 + i))

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Keuangan / Bagi Hasil"
        title="Bagi Hasil & Dividen"
        description="Kelola keputusan pembagian laba kepada pemegang saham"
        actions={<Combobox className="w-28" clearable={false} options={years.map(y => ({ value: y, label: y }))} value={String(year)} onChange={v => setYear(Number(v))} />}
      />

      {decisions.error && <InfoNote tone="red">{decisions.error}</InfoNote>}

      <TabSwitch options={canSeeCheckpoints ? tabs : tabs.filter(t => t.value === 'decisions')} value={tab} onChange={setTab} />

      {tab === 'checkpoint' && canSeeCheckpoints && (
        <CheckpointTab year={year} onProposed={decisions.reload} />
      )}
      {tab === 'decisions' && (
        <DecisionsTab decisions={decisions.data ?? []} onChanged={decisions.reload} />
      )}
    </div>
  )
}
