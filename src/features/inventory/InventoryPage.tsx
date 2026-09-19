import { useCallback, useState } from 'react'
import { Plus } from 'lucide-react'
import { Combobox, InfoNote, MiniStat, PageHeader } from '@/components/common'
import { Button } from '@/components/ui/Button'
import { TabSwitch, type TabOption } from '@/components/ui/TabSwitch'
import { usePermissions } from '@/features/auth/usePermissions'
import { useAsync } from '@/hooks/useAsync'
import { formatKg, toAmount } from '@/lib'
import { inventoryService } from '@/services/inventoryService'
import { HppPerKgPanel } from './components/HppPerKgPanel'
import { ProductSummary } from './components/ProductSummary'
import { StockMovementDrawer } from './components/StockMovementDrawer'
import { StockMovementsTable } from './components/StockMovementsTable'

type Tab = 'summary' | 'movements' | 'hpp'

const tabs: TabOption<Tab>[] = [
  { value: 'summary', label: 'Summary per Produk' },
  { value: 'movements', label: 'Kartu Stok' },
  { value: 'hpp', label: 'HPP per Kg' },
]

/**
 * Summary Inventory & Penjualan, mengikuti tab sheet: per produk per bulan —
 * penjualan (Kg dan Rp), mutasi stok (masuk, keluar, sisa), nilai persediaan.
 *
 * Pembelian dan penjualan mengisi kartu stok otomatis; pemakaian bahan dan
 * hasil produksi diinput di sini.
 */
export function InventoryPage() {
  const permissions = usePermissions()
  const [tab, setTab] = useState<Tab>('summary')
  const [year, setYear] = useState(new Date().getFullYear())
  const [isAdding, setIsAdding] = useState(false)
  const [version, setVersion] = useState(0)

  const load = useCallback(() => inventoryService.summary(year), [year])
  const { data, error, reload } = useAsync(load)
  const years = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - 3 + i))

  const products = data?.products ?? []
  const totalValue = products.reduce((s, p) => s + toAmount(p.totals.inventory_value), 0)
  const totalBalance = products.reduce((s, p) => s + toAmount(p.totals.qty_balance), 0)
  const totalSold = products.reduce((s, p) => s + toAmount(p.totals.sold_qty), 0)

  function changed() {
    reload()
    setVersion(v => v + 1)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operasional / Inventory"
        title="Summary Inventory & Penjualan"
        description="Ringkasan volume, penjualan, nilai persediaan, dan HPP per Kg"
        actions={
          <>
            <Combobox className="w-28" clearable={false} options={years.map(y => ({ value: y, label: y }))} value={String(year)} onChange={v => setYear(Number(v))} />
            {permissions.can('transactions.write') && (
              <Button onClick={() => setIsAdding(true)}>
                <Plus size={16} />
                Input Mutasi
              </Button>
            )}
          </>
        }
      />

      {error && <InfoNote tone="red">{error}</InfoNote>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Nilai Persediaan" value={totalValue} hint="sisa Kg × harga rata-rata" />
        <MiniStat label="Stok Tersisa" value={formatKg(totalBalance)} tone="green" />
        <MiniStat label={`Terjual ${year}`} value={formatKg(totalSold)} />
        <MiniStat label="HPP per Kg" value={data?.hpp_per_kg.hpp_per_kg ? toAmount(data.hpp_per_kg.hpp_per_kg) : '–'} tone="amber" hint="HPP produksi ÷ Kg hasil produksi" />
      </div>

      <TabSwitch options={tabs} value={tab} onChange={setTab} />

      {tab === 'summary' && data && <ProductSummary products={products} />}
      {tab === 'movements' && <StockMovementsTable key={version} year={year} canWrite={permissions.can('transactions.write')} onChanged={changed} />}
      {tab === 'hpp' && data && <HppPerKgPanel hpp={data.hpp_per_kg} year={year} />}

      {isAdding && (
        <StockMovementDrawer
          onClose={() => setIsAdding(false)}
          onSaved={() => {
            setIsAdding(false)
            changed()
          }}
        />
      )}
    </div>
  )
}
