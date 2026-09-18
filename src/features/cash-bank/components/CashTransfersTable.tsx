import { useCallback, useState } from 'react'
import { Card, Combobox, EmptyState, FilterBar, InfoNote, Status, TableWrap } from '@/components/common'
import { useAsync } from '@/hooks/useAsync'
import { formatCurrency, formatDate, toAmount } from '@/lib'
import { cashBankService, type CashTransferFilters } from '@/services/cashBankService'
import type { ApiAccount } from '@/types'

const statusOptions = [
  { value: '', label: 'Semua Status' },
  { value: 'posted', label: 'Diposting' },
  { value: 'cancelled', label: 'Dibatalkan' },
]

type Props = {
  accounts: ApiAccount[]
  onSelect: (id: number) => void
}

/** Daftar transfer antar akun kas/bank. */
export function CashTransfersTable({ accounts, onSelect }: Props) {
  const [filters, setFilters] = useState<CashTransferFilters>({})

  const load = useCallback(() => cashBankService.transfers(filters), [filters])
  const { data, isLoading, error } = useAsync(load)
  const rows = data?.data ?? []

  return (
    <Card>
      <FilterBar
        searchPlaceholder="Cari nomor transfer atau referensi..."
        onSearchChange={value => setFilters({ ...filters, search: value || undefined })}
      >
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
        <Combobox
          className="w-40"
          aria-label="Filter status"
          options={statusOptions}
          value={filters.status ?? ''}
          onChange={value => setFilters({ ...filters, status: value || undefined })}
        />
      </FilterBar>

      {error && (
        <div className="p-4">
          <InfoNote tone="red" variant="inset">{error}</InfoNote>
        </div>
      )}

      {rows.length === 0 && !isLoading ? (
        <EmptyState
          title="Belum ada transfer"
          description="Catat pindah buku atau pengisian petty cash lewat kartu Transfer Antar Akun."
        />
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <th>No. Transfer</th>
              <th>Tanggal</th>
              <th>Dari</th>
              <th>Ke</th>
              <th>Referensi</th>
              <th className="text-right">Nominal</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(transfer => (
              <tr key={transfer.id} className="cursor-pointer" onClick={() => onSelect(transfer.id)}>
                <td className="font-semibold text-blue-700">{transfer.number}</td>
                <td>{formatDate(transfer.date)}</td>
                <td className="font-semibold">{transfer.from_account?.name}</td>
                <td className="font-semibold">{transfer.to_account?.name}</td>
                <td className="text-slate-500">{transfer.reference ?? '–'}</td>
                <td className="money">{formatCurrency(toAmount(transfer.amount))}</td>
                <td>
                  <Status tone={transfer.status === 'posted' ? 'green' : 'slate'}>
                    {transfer.status_label}
                  </Status>
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </Card>
  )
}
