import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { routePaths } from '@/app/router'
import { Card, Combobox, EmptyState, FilterBar, InfoNote, Input, TableWrap } from '@/components/common'
import { useAsync } from '@/hooks/useAsync'
import { formatCurrencyOrDash, formatDate, toAmount } from '@/lib'
import { cashBankService, type CashMutationFilters } from '@/services/cashBankService'
import type { ApiAccount } from '@/types'

const monthStart = () => new Date().toISOString().slice(0, 8) + '01'
const monthEnd = () => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
}

type Props = {
  accounts: ApiAccount[]
  onOpenLedger: (accountId: number) => void
}

/** Mutasi seluruh akun kas/bank: baris jurnal dari modul mana pun. */
export function CashMutationsTable({ accounts, onOpenLedger }: Props) {
  const [filters, setFilters] = useState<CashMutationFilters>({ from: monthStart(), to: monthEnd() })

  const load = useCallback(() => cashBankService.mutations(filters), [filters])
  const { data, isLoading, error } = useAsync(load)
  const rows = data?.data ?? []

  return (
    <Card>
      <FilterBar search={false}>
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
          className="w-56"
          aria-label="Filter akun"
          options={[
            { value: '', label: 'Semua Akun' },
            ...accounts.map(account => ({ value: String(account.id), label: account.label })),
          ]}
          value={filters.accountId ? String(filters.accountId) : ''}
          onChange={value => setFilters({ ...filters, accountId: value ? Number(value) : undefined })}
        />
        {filters.accountId && (
          <button
            type="button"
            className="text-xs font-semibold text-blue-700"
            onClick={() => onOpenLedger(filters.accountId!)}
          >
            Buka di Buku Besar
          </button>
        )}
      </FilterBar>

      {error && (
        <div className="p-4">
          <InfoNote tone="red" variant="inset">{error}</InfoNote>
        </div>
      )}

      {rows.length === 0 && !isLoading ? (
        <EmptyState title="Tidak ada mutasi" description="Belum ada pergerakan kas pada rentang ini." />
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Akun</th>
              <th>Sumber</th>
              <th>Keterangan</th>
              <th>No. Jurnal</th>
              <th className="text-right">Masuk</th>
              <th className="text-right">Keluar</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.id}>
                <td>{formatDate(row.date)}</td>
                <td className="font-semibold">{row.account.name}</td>
                <td className="text-slate-500">
                  {row.source_label}
                  {row.source_number && <span className="block text-[10px]">{row.source_number}</span>}
                </td>
                <td>{row.description}</td>
                <td>
                  {row.journal_number && (
                    <Link
                      to={`${routePaths.journals}?search=${encodeURIComponent(row.journal_number)}&month=${row.date.slice(0, 7)}`}
                      className="font-semibold text-blue-700"
                    >
                      {row.journal_number}
                    </Link>
                  )}
                </td>
                <td className="money !text-emerald-700">{formatCurrencyOrDash(toAmount(row.debit))}</td>
                <td className="money !text-rose-700">{formatCurrencyOrDash(toAmount(row.credit))}</td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </Card>
  )
}
