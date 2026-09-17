import { useState } from 'react'
import { Plus } from 'lucide-react'
import { MiniStat, PageHeader } from '@/components/common'
import { Button } from '@/components/ui/Button'
import { TabSwitch, type TabOption } from '@/components/ui/TabSwitch'
import { assetSummary } from '@/mocks/assets'
import { AssetListTab } from './components/AssetListTab'
import { DepreciationTab } from './components/DepreciationTab'

type AssetTab = 'assets' | 'depreciation'

const tabs: TabOption<AssetTab>[] = [
  { value: 'assets', label: 'Daftar Aset' },
  { value: 'depreciation', label: 'Depresiasi' },
]

export function AssetsPage() {
  const [tab, setTab] = useState<AssetTab>('assets')

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operasional / Aset"
        title="Aset & Depresiasi"
        description="Kelola aset tetap dan perhitungan penyusutan garis lurus"
        actions={
          <Button>
            <Plus size={16} />
            Tambah Aset
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <MiniStat label="Total Nilai Aset" value={assetSummary.totalValue} />
        <MiniStat
          label="Akumulasi Depresiasi"
          value={assetSummary.accumulatedDepreciation}
          tone="amber"
        />
        <MiniStat label="Nilai Buku" value={assetSummary.bookValue} tone="green" />
      </div>

      <TabSwitch options={tabs} value={tab} onChange={setTab} />

      {tab === 'assets' ? <AssetListTab /> : <DepreciationTab />}
    </div>
  )
}
