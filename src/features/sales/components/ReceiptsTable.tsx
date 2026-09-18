import { Card, Combobox, EmptyState, FilterBar, Status, TableWrap } from '@/components/common'
import { cn, formatCurrency, formatDate, toAmount } from '@/lib'
import type { ReceiptFilters } from '@/services/receiptService'
import type { ApiCustomer, ApiPaymentReceipt } from '@/types'

const receiptStatusOptions = [
  { value: '', label: 'Semua Status' },
  { value: 'posted', label: 'Diposting' },
  { value: 'cancelled', label: 'Dibatalkan' },
]

type Props = {
  receipts: ApiPaymentReceipt[]
  customers: ApiCustomer[]
  filters: ReceiptFilters
  onFilterChange: (filters: ReceiptFilters) => void
  isLoading: boolean
  onSelect: (id: number) => void
  selectedId: number | null
}

/** Bukti penerimaan pembayaran dari customer. */
export function ReceiptsTable({
  receipts,
  customers,
  filters,
  onFilterChange,
  isLoading,
  onSelect,
  selectedId,
}: Props) {
  return (
    <Card>
      <FilterBar
        searchValue={filters.search}
        searchPlaceholder="Cari nomor bukti, referensi, atau customer..."
        onSearchChange={value => onFilterChange({ ...filters, search: value || undefined })}
      >
        <Combobox
          className="w-56"
          aria-label="Filter customer"
          options={[
            { value: '', label: 'Semua Customer' },
            ...customers.map(customer => ({
              value: String(customer.id),
              label: customer.name,
              description: customer.code,
            })),
          ]}
          value={filters.customerId ? String(filters.customerId) : ''}
          onChange={value =>
            onFilterChange({ ...filters, customerId: value ? Number(value) : undefined })
          }
        />

        <Combobox
          className="w-44"
          aria-label="Filter status"
          options={receiptStatusOptions}
          value={filters.status ?? ''}
          onChange={value => onFilterChange({ ...filters, status: value || undefined })}
        />
      </FilterBar>

      {receipts.length === 0 && !isLoading ? (
        <EmptyState
          title="Belum ada penerimaan"
          description="Catat pelunasan invoice lewat tombol Terima Pembayaran di kanan atas."
        />
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <th>No. Bukti</th>
              <th>Tanggal</th>
              <th>Customer</th>
              <th>Diterima di</th>
              <th>Referensi</th>
              <th>Invoice</th>
              <th className="text-right">Nilai</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {receipts.map(receipt => (
              <tr
                key={receipt.id}
                onClick={() => onSelect(receipt.id)}
                className={cn('cursor-pointer', receipt.id === selectedId && 'bg-blue-50/60')}
              >
                <td className="font-semibold text-blue-700">{receipt.number}</td>
                <td>{formatDate(receipt.date)}</td>
                <td className="font-semibold">{receipt.customer?.name}</td>
                <td>{receipt.cash_account?.name}</td>
                <td className="text-slate-500">{receipt.reference ?? '–'}</td>
                <td className="text-slate-500">
                  {(receipt.allocations ?? []).map(a => a.invoice?.number).join(', ') || '–'}
                </td>
                <td className="money">{formatCurrency(toAmount(receipt.amount))}</td>
                <td>
                  <Status tone={receipt.status === 'posted' ? 'green' : 'slate'}>
                    {receipt.status_label}
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
