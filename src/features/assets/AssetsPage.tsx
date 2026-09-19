import { useCallback, useState } from 'react'
import { Plus } from 'lucide-react'
import { InfoNote, MiniStat, PageHeader } from '@/components/common'
import { Button } from '@/components/ui/Button'
import { TabSwitch, type TabOption } from '@/components/ui/TabSwitch'
import { usePermissions } from '@/features/auth/usePermissions'
import { useAsync } from '@/hooks/useAsync'
import { toAmount } from '@/lib'
import { assetService } from '@/services/assetService'
import type { ApiFixedAsset } from '@/types'
import { AssetDrawer } from './components/AssetDrawer'
import { AssetListTab } from './components/AssetListTab'
import { DepreciationTab } from './components/DepreciationTab'

type AssetTab = 'assets' | 'depreciation'

const tabs: TabOption<AssetTab>[] = [
  { value: 'assets', label: 'Daftar Aset' },
  { value: 'depreciation', label: 'Depresiasi' },
]

/**
 * Aset tetap dan penyusutan garis lurus, mengikuti tab ASET & DEPRESIASI.
 *
 * Rumus: residu = nominal × 1% (parameter), penyusutan/bulan = (nominal −
 * residu) / umur manfaat bulan. Penyusutan dijalankan per bulan dari tab
 * Depresiasi; jurnalnya per jenis aset.
 */
export function AssetsPage() {
  const permissions = usePermissions()
  const [tab, setTab] = useState<AssetTab>('assets')
  const [editing, setEditing] = useState<ApiFixedAsset | 'new' | null>(null)

  const load = useCallback(() => Promise.all([assetService.list(), assetService.types()]), [])
  const { data, error, isLoading, reload } = useAsync(load)
  const [assets = [], types = []] = data ?? []

  const active = assets.filter(a => a.status === 'active')
  const sum = (pick: (a: ApiFixedAsset) => string) => active.reduce((t, a) => t + toAmount(pick(a)), 0)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operasional / Aset"
        title="Aset & Depresiasi"
        description="Kelola aset tetap dan perhitungan penyusutan garis lurus"
        actions={
          permissions.can('assets.write') && (
            <Button onClick={() => setEditing('new')}>
              <Plus size={16} />
              Tambah Aset
            </Button>
          )
        }
      />

      {error && <InfoNote tone="red">{error}</InfoNote>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Nilai Perolehan" value={sum(a => a.cost)} />
        <MiniStat label="Akumulasi Depresiasi" value={sum(a => a.accumulated_depreciation)} tone="amber" />
        <MiniStat label="Nilai Buku" value={sum(a => a.book_value)} tone="green" />
        <MiniStat label="Depresiasi / Bulan" value={sum(a => a.monthly_depreciation)} hint={`${active.length} aset aktif`} />
      </div>

      <TabSwitch options={tabs} value={tab} onChange={setTab} />

      {tab === 'assets' && (
        <AssetListTab
          assets={assets}
          types={types}
          isLoading={isLoading}
          canWrite={permissions.can('assets.write')}
          onEdit={setEditing}
          onChanged={reload}
        />
      )}
      {tab === 'depreciation' && <DepreciationTab canWrite={permissions.can('assets.write')} onChanged={reload} />}

      {editing && (
        <AssetDrawer
          asset={editing === 'new' ? null : editing}
          types={types}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            reload()
          }}
        />
      )}
    </div>
  )
}
