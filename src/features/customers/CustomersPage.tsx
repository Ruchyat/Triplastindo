import {
  Card,
  CardHeader,
  FilterBar,
  InfoNote,
  MiniStat,
  PageHeader,
  Select,
  Status,
  TableWrap,
} from '@/components/common'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatCurrencyOrDash } from '@/lib'
import { customerBalances, customerSummary } from '@/mocks/parties'
import { BalanceLegend } from './components/BalanceLegend'

const legend = [
  {
    title: 'Piutang',
    tone: 'amber' as const,
    description: 'Hak perusahaan yang belum dibayar customer dari invoice kredit.',
  },
  {
    title: 'Deposit',
    tone: 'blue' as const,
    description: 'Uang customer yang sudah diterima tetapi belum menjadi pendapatan.',
  },
  {
    title: 'Terbayar',
    tone: 'green' as const,
    description: 'Pembayaran yang sudah diterima dan ditautkan ke invoice.',
  },
]

/**
 * Halaman Customer.
 *
 * Pusat monitoring hubungan keuangan per customer — penjualan, pembayaran,
 * piutang, dan deposit. Master datanya tetap dikelola dari menu Setup.
 */
export function CustomersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Keuangan / Customer"
        title="Customer"
        description="Lihat posisi penjualan, piutang, dan deposit setiap customer"
        actions={<Button variant="outline">Kelola Master Customer</Button>}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Total Penjualan YTD" value={customerSummary.totalSalesYtd} />
        <MiniStat label="Total Piutang" value={customerSummary.totalReceivable} tone="amber" />
        <MiniStat label="Total Deposit Customer" value={customerSummary.totalDeposit} tone="green" />
        <MiniStat label="Customer Aktif" value={customerSummary.activeCustomers} />
      </div>

      <InfoNote>
        Deposit otomatis digunakan saat invoice dibuat. Karena itu saldo deposit hanya tampil pada
        customer tanpa piutang terbuka.
      </InfoNote>

      <Card>
        <FilterBar>
          <Select>
            <option>Semua Status</option>
          </Select>
          <Select>
            <option>Piutang Terbesar</option>
            <option>Deposit Terbesar</option>
          </Select>
        </FilterBar>

        <TableWrap>
          <thead>
            <tr>
              <th>Kode</th>
              <th>Customer</th>
              <th className="text-right">Total Penjualan</th>
              <th className="text-right">Terbayar</th>
              <th className="text-right">Piutang</th>
              <th className="text-right">Deposit</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {customerBalances.map(customer => (
              <tr key={customer.code}>
                <td className="font-semibold text-blue-700">{customer.code}</td>
                <td className="font-semibold text-slate-800">{customer.name}</td>
                <td className="money">{formatCurrency(customer.totalSales)}</td>
                <td className="money !text-emerald-700">{formatCurrency(customer.paid)}</td>
                <td className="money !text-amber-700">{formatCurrency(customer.receivable)}</td>
                <td className="money !text-blue-700">{formatCurrencyOrDash(customer.deposit)}</td>
                <td>
                  <Status tone="green">{customer.status}</Status>
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
        <CardHeader title="Cara membaca saldo customer" />
        <BalanceLegend items={legend} />
      </Card>
    </div>
  )
}
