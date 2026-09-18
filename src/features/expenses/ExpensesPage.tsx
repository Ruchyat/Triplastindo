import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { toPath } from '@/app/router'
import {
  Card,
  Combobox,
  EmptyState,
  FilterBar,
  InfoNote,
  Input,
  MiniStat,
  PageHeader,
  Status,
  TableWrap,
} from '@/components/common'
import { Button } from '@/components/ui/Button'
import { useAsync } from '@/hooks/useAsync'
import { formatCurrency, formatDate, toAmount } from '@/lib'
import { masterDataService } from '@/services/masterDataService'
import { EXPENSE_GROUPS } from './expenseGroups'
import { useExpenses } from './useExpenses'

const statusOptions = [
  { value: '', label: 'Semua Status' },
  { value: 'posted', label: 'Diposting' },
  { value: 'cancelled', label: 'Dibatalkan' },
]

/**
 * Halaman Pengeluaran.
 *
 * Untuk biaya yang tidak melalui proses pembelian barang — listrik,
 * transportasi, konsumsi, admin bank, dan sejenisnya. Akun bebannya dipilih
 * langsung, dan jurnalnya terbentuk saat disimpan.
 */
export function ExpensesPage() {
  const navigate = useNavigate()
  const expenses = useExpenses()
  const { filters, setFilters } = expenses

  const loadFilters = useCallback(
    () =>
      Promise.all([
        masterDataService.accounts({ groups: EXPENSE_GROUPS }),
        masterDataService.accounts({ isCash: true }),
      ]),
    [],
  )
  const master = useAsync(loadFilters)
  const [expenseAccounts = [], cashAccounts = []] = master.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Transaksi / Pengeluaran"
        title="Pengeluaran Biaya"
        description="Catat biaya operasional yang dibayar langsung"
        actions={
          <Button onClick={() => navigate(toPath.expenseNew())}>
            <Plus size={16} />
            Catat Pengeluaran
          </Button>
        }
      />

      {(expenses.error || master.error) && (
        <InfoNote tone="red">{expenses.error ?? master.error}</InfoNote>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <MiniStat label="Total Pengeluaran" value={toAmount(expenses.summary?.total)} />
        <MiniStat label="Beban Produksi (HPP)" value={toAmount(expenses.summary?.production)} tone="amber" />
        <MiniStat label="Beban Operasional" value={toAmount(expenses.summary?.operational)} />
      </div>

      <Card>
        <FilterBar
          searchValue={filters.search}
          searchPlaceholder="Cari nomor, keterangan, atau penerima..."
          onSearchChange={value => setFilters({ ...filters, search: value || undefined })}
        >
          <Input
            type="date"
            aria-label="Dari tanggal"
            className="w-40"
            value={filters.from ?? ''}
            onChange={e => setFilters({ ...filters, from: e.target.value || undefined })}
          />
          <Input
            type="date"
            aria-label="Sampai tanggal"
            className="w-40"
            value={filters.to ?? ''}
            onChange={e => setFilters({ ...filters, to: e.target.value || undefined })}
          />
          <Combobox
            className="w-60"
            aria-label="Filter akun beban"
            options={[
              { value: '', label: 'Semua Akun Beban' },
              ...expenseAccounts.map(account => ({
                value: String(account.id),
                label: account.label,
                description: account.category?.name,
              })),
            ]}
            value={filters.expenseAccountId ? String(filters.expenseAccountId) : ''}
            onChange={value =>
              setFilters({ ...filters, expenseAccountId: value ? Number(value) : undefined })
            }
          />
          <Combobox
            className="w-52"
            aria-label="Filter akun pembayaran"
            options={[
              { value: '', label: 'Semua Akun Pembayaran' },
              ...cashAccounts.map(account => ({ value: String(account.id), label: account.label })),
            ]}
            value={filters.cashAccountId ? String(filters.cashAccountId) : ''}
            onChange={value =>
              setFilters({ ...filters, cashAccountId: value ? Number(value) : undefined })
            }
          />
          <Combobox
            className="w-40"
            aria-label="Filter status"
            options={statusOptions}
            value={filters.status ?? ''}
            onChange={value => setFilters({ ...filters, status: value || undefined })}
          />
        </FilterBar>

        {expenses.expenses.length === 0 && !expenses.isLoading ? (
          <EmptyState
            title="Belum ada pengeluaran"
            description="Catat biaya yang dibayar langsung lewat tombol di kanan atas."
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <th>No. Bukti</th>
                <th>Tanggal</th>
                <th>Akun Beban</th>
                <th>Keterangan</th>
                <th>Penerima</th>
                <th className="text-right">Nominal</th>
                <th>Dibayar dari</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {expenses.expenses.map(expense => (
                <tr
                  key={expense.id}
                  className="cursor-pointer"
                  onClick={() => navigate(toPath.expense(expense.id))}
                >
                  <td className="font-semibold text-blue-700">{expense.number}</td>
                  <td>{formatDate(expense.date)}</td>
                  <td className="font-semibold">{expense.expense_account?.name}</td>
                  <td>{expense.description}</td>
                  <td className="text-slate-500">{expense.payee ?? '–'}</td>
                  <td className="money">{formatCurrency(toAmount(expense.amount))}</td>
                  <td>{expense.cash_account?.name}</td>
                  <td>
                    <Status tone={expense.status === 'posted' ? 'green' : 'slate'}>
                      {expense.status_label}
                    </Status>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>
    </div>
  )
}
