import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { routePaths } from '@/app/router'
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
import { BalanceLegend } from '@/features/customers/components/BalanceLegend'
import { useAsync } from '@/hooks/useAsync'
import { formatCurrency, formatCurrencyOrDash, toAmount } from '@/lib'
import { masterDataService } from '@/services/masterDataService'

const legend = [
  {
    title: 'Total Pembelian',
    tone: 'blue' as const,
    description: 'Seluruh tagihan supplier yang diposting tahun ini, tunai maupun bertermin.',
  },
  {
    title: 'Utang',
    tone: 'amber' as const,
    description: 'Tagihan bertermin yang belum dibayar, dari tahun mana pun.',
  },
  {
    title: 'Dibayar',
    tone: 'green' as const,
    description: 'Pembayaran yang sudah dikeluarkan dan ditautkan ke tagihan.',
  },
]

const sortOptions = [
  { value: 'payable', label: 'Utang Terbesar' },
  { value: 'purchases', label: 'Pembelian Terbesar' },
  { value: 'name', label: 'Nama A–Z' },
]

/**
 * Halaman Supplier.
 *
 * Pusat monitoring hubungan keuangan per supplier — pembelian, pembayaran,
 * dan utang. Master datanya dikelola dari Setup.
 */
export function SuppliersPage() {
  const navigate = useNavigate()
  const year = new Date().getFullYear()
  const [sort, setSort] = useState('payable')

  const load = useCallback(
    () => masterDataService.suppliers({ withBalance: true, activityYear: year }),
    [year],
  )
  const { data, error, isLoading } = useAsync(load)
  const suppliers = [...(data ?? [])].sort((a, b) => {
    switch (sort) {
      case 'purchases': return toAmount(b.total_purchases) - toAmount(a.total_purchases)
      case 'name': return a.name.localeCompare(b.name, 'id')
      default: return toAmount(b.open_payable) - toAmount(a.open_payable)
    }
  })

  const sum = (pick: (s: (typeof suppliers)[number]) => string | undefined) =>
    suppliers.reduce((total, supplier) => total + toAmount(pick(supplier)), 0)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Keuangan / Supplier"
        title="Supplier"
        description="Lihat posisi pembelian, pembayaran, dan utang setiap supplier"
        actions={
          <Button variant="outline" onClick={() => navigate(`${routePaths.setup}?tab=suppliers`)}>
            Kelola Master Supplier
          </Button>
        }
      />

      {error && <InfoNote tone="red">{error}</InfoNote>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label={`Total Pembelian ${year}`} value={sum(s => s.total_purchases)} />
        <MiniStat label="Total Dibayar" value={sum(s => s.paid)} tone="green" />
        <MiniStat label="Total Utang Supplier" value={sum(s => s.open_payable)} tone="amber" />
        <MiniStat label="Supplier Aktif" value={String(suppliers.length)} />
      </div>

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

        {suppliers.length === 0 && !isLoading ? (
          <EmptyState title="Belum ada supplier" description="Tambahkan supplier lewat menu Setup." />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <th>Kode</th>
                <th>Supplier</th>
                <th>Termin</th>
                <th className="text-right">Pembelian {year}</th>
                <th className="text-right">Dibayar</th>
                <th className="text-right">Utang</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {suppliers.map(supplier => {
                const payable = toAmount(supplier.open_payable)
                return (
                  <tr key={supplier.id}>
                    <td className="font-semibold text-blue-700">{supplier.code}</td>
                    <td className="font-semibold text-slate-800">{supplier.name}</td>
                    <td>{supplier.payment_term_days} hari</td>
                    <td className="money">{formatCurrency(toAmount(supplier.total_purchases))}</td>
                    <td className="money !text-emerald-700">{formatCurrency(toAmount(supplier.paid))}</td>
                    <td className="money !text-amber-700">{formatCurrencyOrDash(payable)}</td>
                    <td>
                      <Status tone={payable > 0 ? 'amber' : 'green'}>
                        {payable > 0 ? 'Ada Utang' : 'Lunas'}
                      </Status>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="font-semibold text-blue-700"
                        onClick={() => navigate(`${routePaths.payables}?supplier=${supplier.id}`)}
                      >
                        Lihat utang
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
        <CardHeader title="Cara membaca saldo supplier" />
        <BalanceLegend items={legend} />
      </Card>
    </div>
  )
}
