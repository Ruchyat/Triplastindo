import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { routePaths, toPath } from '@/app/router'
import {
  Card,
  CardHeader,
  Combobox,
  EmptyState,
  FilterBar,
  InfoNote,
  MiniStat,
  PageHeader,
  Status,
  TableWrap,
} from '@/components/common'
import { Button } from '@/components/ui/Button'
import { useAsync } from '@/hooks/useAsync'
import { formatCurrency, formatCurrencyOrDash, toAmount } from '@/lib'
import { masterDataService } from '@/services/masterDataService'
import { BalanceLegend } from './components/BalanceLegend'

const legend = [
  {
    title: 'Piutang',
    tone: 'amber' as const,
    description: 'Hak perusahaan yang belum dibayar customer dari invoice bertermin.',
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

const sortOptions = [
  { value: 'receivable', label: 'Piutang Terbesar' },
  { value: 'deposit', label: 'Deposit Terbesar' },
  { value: 'sales', label: 'Penjualan Terbesar' },
  { value: 'name', label: 'Nama A–Z' },
]

/**
 * Halaman Customer.
 *
 * Pusat monitoring hubungan keuangan per customer — penjualan, pembayaran,
 * piutang, dan deposit tahun berjalan. Master datanya dikelola dari Setup.
 */
export function CustomersPage() {
  const navigate = useNavigate()
  const year = new Date().getFullYear()
  const [sort, setSort] = useState('receivable')

  const load = useCallback(
    () => masterDataService.customers({ withBalance: true, activityYear: year }),
    [year],
  )
  const { data, error, isLoading } = useAsync(load)
  const customers = [...(data ?? [])].sort((a, b) => {
    switch (sort) {
      case 'deposit': return toAmount(b.deposit_balance) - toAmount(a.deposit_balance)
      case 'sales': return toAmount(b.total_sales) - toAmount(a.total_sales)
      case 'name': return a.name.localeCompare(b.name, 'id')
      default: return toAmount(b.open_receivable) - toAmount(a.open_receivable)
    }
  })

  const sum = (pick: (c: (typeof customers)[number]) => string | undefined) =>
    customers.reduce((total, customer) => total + toAmount(pick(customer)), 0)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Keuangan / Customer"
        title="Customer"
        description="Lihat posisi penjualan, piutang, dan deposit setiap customer"
        actions={
          <Button variant="outline" onClick={() => navigate(`${routePaths.setup}?tab=customers`)}>
            Kelola Master Customer
          </Button>
        }
      />

      {error && <InfoNote tone="red">{error}</InfoNote>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label={`Total Penjualan ${year}`} value={sum(c => c.total_sales)} />
        <MiniStat label="Total Piutang" value={sum(c => c.open_receivable)} tone="amber" />
        <MiniStat label="Total Deposit Customer" value={sum(c => c.deposit_balance)} tone="green" />
        <MiniStat label="Customer Aktif" value={String(customers.length)} />
      </div>

      <InfoNote>
        Deposit dipotong saat invoice diposting bila pencatat memilihnya. Karena itu saldo deposit
        umumnya hanya tampil pada customer tanpa piutang terbuka.
      </InfoNote>

      <Card>
        <FilterBar search={false}>
          <Combobox
            className="w-52"
            clearable={false}
            aria-label="Urutkan"
            options={sortOptions}
            value={sort}
            onChange={setSort}
          />
        </FilterBar>

        {customers.length === 0 && !isLoading ? (
          <EmptyState title="Belum ada customer" description="Tambahkan customer lewat menu Setup." />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <th>Kode</th>
                <th>Customer</th>
                <th className="text-right">Penjualan {year}</th>
                <th className="text-right">Terbayar</th>
                <th className="text-right">Piutang</th>
                <th className="text-right">Deposit</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {customers.map(customer => {
                const receivable = toAmount(customer.open_receivable)
                return (
                  <tr key={customer.id}>
                    <td className="font-semibold text-blue-700">{customer.code}</td>
                    <td className="font-semibold text-slate-800">{customer.name}</td>
                    <td className="money">{formatCurrency(toAmount(customer.total_sales))}</td>
                    <td className="money !text-emerald-700">{formatCurrency(toAmount(customer.paid))}</td>
                    <td className="money !text-amber-700">{formatCurrencyOrDash(receivable)}</td>
                    <td className="money !text-blue-700">{formatCurrencyOrDash(toAmount(customer.deposit_balance))}</td>
                    <td>
                      <Status tone={receivable > 0 ? 'amber' : 'green'}>
                        {receivable > 0 ? 'Ada Piutang' : 'Lunas'}
                      </Status>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="font-semibold text-blue-700"
                        onClick={() => navigate(toPath.depositCard(customer.id))}
                      >
                        Lihat detail
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </TableWrap>
        )}
      </Card>

      <Card>
        <CardHeader title="Cara membaca saldo customer" />
        <BalanceLegend items={legend} />
      </Card>
    </div>
  )
}
