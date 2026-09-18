import { Card, Combobox, EmptyState, FilterBar, Status, TableWrap } from '@/components/common'
import { cn, formatCurrency, formatDate, toAmount } from '@/lib'
import type { SupplierPaymentFilters } from '@/services/supplierPaymentService'
import type { ApiSupplier, ApiSupplierPayment } from '@/types'

const statusOptions = [
  { value: '', label: 'Semua Status' },
  { value: 'posted', label: 'Diposting' },
  { value: 'cancelled', label: 'Dibatalkan' },
]

type Props = {
  payments: ApiSupplierPayment[]
  suppliers: ApiSupplier[]
  filters: SupplierPaymentFilters
  onFilterChange: (filters: SupplierPaymentFilters) => void
  isLoading: boolean
  onSelect: (id: number) => void
}

/** Bukti pembayaran kepada supplier. */
export function SupplierPaymentsTable({
  payments,
  suppliers,
  filters,
  onFilterChange,
  isLoading,
  onSelect,
}: Props) {
  return (
    <Card>
      <FilterBar
        searchValue={filters.search}
        searchPlaceholder="Cari nomor bukti, referensi, atau supplier..."
        onSearchChange={value => onFilterChange({ ...filters, search: value || undefined })}
      >
        <Combobox
          className="w-56"
          aria-label="Filter supplier"
          options={[
            { value: '', label: 'Semua Supplier' },
            ...suppliers.map(supplier => ({
              value: String(supplier.id),
              label: supplier.name,
              description: supplier.code,
            })),
          ]}
          value={filters.supplierId ? String(filters.supplierId) : ''}
          onChange={value =>
            onFilterChange({ ...filters, supplierId: value ? Number(value) : undefined })
          }
        />

        <Combobox
          className="w-44"
          aria-label="Filter status"
          options={statusOptions}
          value={filters.status ?? ''}
          onChange={value => onFilterChange({ ...filters, status: value || undefined })}
        />
      </FilterBar>

      {payments.length === 0 && !isLoading ? (
        <EmptyState
          title="Belum ada pembayaran"
          description="Catat pelunasan tagihan lewat tombol Bayar Supplier di kanan atas."
        />
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <th>No. Bukti</th>
              <th>Tanggal</th>
              <th>Supplier</th>
              <th>Dibayar dari</th>
              <th>Referensi</th>
              <th>Tagihan</th>
              <th className="text-right">Nilai</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(payment => (
              <tr key={payment.id} onClick={() => onSelect(payment.id)} className={cn('cursor-pointer')}>
                <td className="font-semibold text-blue-700">{payment.number}</td>
                <td>{formatDate(payment.date)}</td>
                <td className="font-semibold">{payment.supplier?.name}</td>
                <td>{payment.cash_account?.name}</td>
                <td className="text-slate-500">{payment.reference ?? '–'}</td>
                <td className="text-slate-500">
                  {(payment.allocations ?? []).map(a => a.bill?.number).join(', ') || '–'}
                </td>
                <td className="money">{formatCurrency(toAmount(payment.amount))}</td>
                <td>
                  <Status tone={payment.status === 'posted' ? 'green' : 'slate'}>
                    {payment.status_label}
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
