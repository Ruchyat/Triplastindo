import {
  Card,
  EmptyState,
  FilterBar,
  InfoNote,
  MiniStat,
  Select,
  TableWrap,
} from '@/components/common'
import { cn, formatCurrency, formatCurrencyOrDash, formatDate, toAmount } from '@/lib'
import type { DepositFilters } from '@/services/depositService'
import type { ApiDepositBalance, ApiDepositSummary } from '@/types'

type Props = {
  balances: ApiDepositBalance[]
  summary?: ApiDepositSummary
  filters: DepositFilters
  onFilterChange: (filters: DepositFilters) => void
  isLoading: boolean
  onSelect: (customerId: number) => void
  selectedId: number | null
  /** Sembunyikan catatan penjelas bila halaman sudah menampilkannya di atas. */
  showNote?: boolean
}

/**
 * Posisi deposit per customer.
 *
 * Satu baris per customer, bukan per mutasi: yang ditanyakan sehari-hari
 * adalah "customer ini masih punya titipan berapa", bukan "apa yang terjadi
 * pada tanggal sekian". Riwayat mutasinya dibuka lewat panel setelah barisnya
 * diklik.
 */
export function DepositBalanceTable({
  balances,
  summary,
  filters,
  onFilterChange,
  isLoading,
  onSelect,
  selectedId,
  showNote = true,
}: Props) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        <MiniStat label="Total Saldo Deposit" value={toAmount(summary?.total_balance)} />
        <MiniStat label="Deposit Masuk" value={toAmount(summary?.received)} tone="green" />
        <MiniStat
          label="Digunakan / Dikembalikan"
          value={toAmount(summary?.applied_or_refunded)}
          tone="amber"
        />
      </div>

      <Card>
        {showNote && (
          <InfoNote variant="inset">
            Deposit pelanggan dicatat sebagai <b>kewajiban</b>, bukan pendapatan. Saldo baru menjadi
            bagian pembayaran ketika digunakan pada invoice.
          </InfoNote>
        )}

        <FilterBar
          searchValue={filters.search}
          searchPlaceholder="Cari customer..."
          onSearchChange={value => onFilterChange({ ...filters, search: value || undefined })}
        >
          <Select
            value={filters.withBalance ? 'balance' : ''}
            onChange={event =>
              onFilterChange({ ...filters, withBalance: event.target.value === 'balance' })
            }
          >
            <option value="">Semua yang pernah berdeposit</option>
            <option value="balance">Hanya yang masih bersaldo</option>
          </Select>
        </FilterBar>

        {balances.length === 0 && !isLoading ? (
          <EmptyState
            title="Belum ada deposit"
            description="Terima deposit pelanggan lewat tombol di kanan atas."
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Mutasi Terakhir</th>
                <th className="text-right">Deposit Masuk</th>
                <th className="text-right">Terpakai</th>
                <th className="text-right">Dikembalikan</th>
                <th className="text-right">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {balances.map(row => (
                <tr
                  key={row.customer.id}
                  onClick={() => onSelect(row.customer.id)}
                  className={cn(
                    'cursor-pointer',
                    row.customer.id === selectedId && 'bg-blue-50/60',
                  )}
                >
                  <td className="font-semibold text-slate-800">
                    {row.customer.name}
                    <span className="block text-[10px] text-slate-400">{row.customer.code}</span>
                  </td>
                  <td className="text-slate-500">{formatDate(row.last_activity)}</td>
                  <td className="money !text-emerald-700">
                    {formatCurrencyOrDash(toAmount(row.received))}
                  </td>
                  <td className="money !text-blue-700">
                    {formatCurrencyOrDash(toAmount(row.applied))}
                  </td>
                  <td className="money !text-amber-700">
                    {formatCurrencyOrDash(toAmount(row.refunded))}
                  </td>
                  <td className="money">{formatCurrency(toAmount(row.balance))}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>
    </>
  )
}
