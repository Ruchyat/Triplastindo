import {
  Card,
  CardHeader,
  FilterBar,
  MiniStat,
  PageHeader,
  Select,
  Status,
  TableWrap,
} from '@/components/common'
import { Button } from '@/components/ui/Button'
import { BalanceLegend } from '@/features/customers/components/BalanceLegend'
import { formatCurrency } from '@/lib'
import { supplierBalances, supplierSummary } from '@/mocks/parties'

const legend = [
  {
    title: 'Total Pembelian',
    tone: 'blue' as const,
    description: 'Nilai seluruh tagihan pembelian yang sudah dibuat.',
  },
  {
    title: 'Utang',
    tone: 'amber' as const,
    description: 'Kewajiban perusahaan yang belum dibayarkan kepada supplier.',
  },
  {
    title: 'Dibayar',
    tone: 'green' as const,
    description: 'Pembayaran yang sudah ditautkan ke tagihan supplier.',
  },
]

/**
 * Halaman Supplier.
 *
 * Pusat monitoring pembelian, pembayaran, dan utang per supplier.
 * Master datanya tetap dikelola dari menu Setup.
 */
export function SuppliersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Keuangan / Supplier"
        title="Supplier"
        description="Lihat posisi pembelian, pembayaran, dan utang kepada setiap supplier"
        actions={<Button variant="outline">Kelola Master Supplier</Button>}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Total Pembelian YTD" value={supplierSummary.totalPurchasesYtd} />
        <MiniStat label="Total Dibayar" value={supplierSummary.totalPaid} tone="green" />
        <MiniStat label="Total Utang Supplier" value={supplierSummary.totalPayable} tone="amber" />
        <MiniStat label="Tagihan Terbuka" value={supplierSummary.openBills} />
      </div>

      <Card>
        <FilterBar>
          <Select>
            <option>Semua Kategori</option>
          </Select>
          <Select>
            <option>Utang Terbesar</option>
            <option>Nama Supplier</option>
          </Select>
        </FilterBar>

        <TableWrap>
          <thead>
            <tr>
              <th>Kode</th>
              <th>Supplier</th>
              <th className="text-right">Total Pembelian</th>
              <th className="text-right">Dibayar</th>
              <th className="text-right">Utang</th>
              <th>Tagihan Terbuka</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {supplierBalances.map(supplier => (
              <tr key={supplier.code}>
                <td className="font-semibold text-blue-700">{supplier.code}</td>
                <td className="font-semibold text-slate-800">{supplier.name}</td>
                <td className="money">{formatCurrency(supplier.totalPurchases)}</td>
                <td className="money !text-emerald-700">{formatCurrency(supplier.paid)}</td>
                <td className="money !text-amber-700">{formatCurrency(supplier.payable)}</td>
                <td>
                  <Status tone={supplier.openBills === 'Lunas' ? 'green' : 'amber'}>
                    {supplier.openBills}
                  </Status>
                </td>
                <td>
                  <button className="font-semibold text-blue-700">Lihat detail</button>
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Card>

      <Card>
        <CardHeader title="Cara membaca saldo supplier" />
        <BalanceLegend items={legend} />
      </Card>
    </div>
  )
}
