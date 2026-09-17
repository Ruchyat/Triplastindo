import { useState } from 'react'
import { Plus } from 'lucide-react'
import {
  Card,
  CardHeader,
  MiniStat,
  PageHeader,
  TableWrap,
} from '@/components/common'
import { StockTrendChart } from '@/components/charts/StockTrendChart'
import { Button } from '@/components/ui/Button'
import { TabSwitch, type TabOption } from '@/components/ui/TabSwitch'
import { formatCurrency, formatKg, formatNumber } from '@/lib'
import { inventoryMonths, inventorySummary, inventoryTabs } from '@/mocks/inventory'

type InventoryTab = (typeof inventoryTabs)[number]

const tabs: TabOption<InventoryTab>[] = inventoryTabs.map(label => ({ value: label, label }))

/**
 * Halaman Summary Inventory & Penjualan.
 *
 * Mengikuti struktur summary yang sudah ada: penjualan per bulan, mutasi
 * kuantitas, dan nilai persediaan. Belum terhubung ke engine inventory.
 */
export function InventoryPage() {
  const [tab, setTab] = useState<InventoryTab>(inventoryTabs[0])

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operasional / Inventory"
        title="Summary Inventory & Penjualan"
        description="Ringkasan volume, penjualan, dan nilai persediaan"
        actions={
          <Button>
            <Plus size={16} />
            Input Mutasi
          </Button>
        }
      />

      <TabSwitch options={tabs} value={tab} onChange={setTab} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Penjualan September" value={inventorySummary.monthlySales} />
        <MiniStat label="Qty Terjual" value={inventorySummary.soldLabel} />
        <MiniStat label="Qty Sisa" value={inventorySummary.remainingLabel} tone="green" />
        <MiniStat label="Nilai Persediaan" value={inventorySummary.inventoryValue} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <Card>
          <CardHeader title={`Penjualan & Persediaan — ${tab}`} description="Rekap bulanan 2026" />
          <TableWrap>
            <thead>
              <tr>
                <th>Bulan</th>
                <th className="text-right">Qty Terjual</th>
                <th className="text-right">Penjualan</th>
                <th className="text-right">Qty In</th>
                <th className="text-right">Qty Out</th>
                <th className="text-right">Qty Sisa</th>
                <th className="text-right">Nilai Persediaan</th>
              </tr>
            </thead>
            <tbody>
              {inventoryMonths.map(month => (
                <tr key={month.month}>
                  <td className="font-semibold">{month.month}</td>
                  <td className="money">{formatKg(month.soldKg)}</td>
                  <td className="money">{formatCurrency(month.sales)}</td>
                  <td className="money">{formatNumber(month.qtyInKg)}</td>
                  <td className="money">{formatNumber(month.qtyOutKg)}</td>
                  <td className="money">{formatNumber(month.remainingKg)}</td>
                  <td className="money">{formatCurrency(month.inventoryValue)}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-bold text-slate-900">Tren Stok</h2>
          <p className="mt-1 text-xs text-slate-500">Qty masuk, keluar, dan saldo (Kg)</p>
          <div className="mt-4 h-[260px]">
            <StockTrendChart data={inventoryMonths} />
          </div>
        </Card>
      </div>
    </div>
  )
}
