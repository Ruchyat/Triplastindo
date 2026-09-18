import { Card, Combobox, EmptyState, FilterBar, MiniStat, Status, TableWrap } from '@/components/common'
import { cn, formatCurrency, formatCurrencyOrDash, formatDate, formatKg, toAmount } from '@/lib'
import { documentStatusTone, type ApiCustomer, type ApiSalesInvoice, type ApiSalesSummary } from '@/types'
import type { SalesInvoiceFilters } from '@/services/salesService'

type Props = {
  invoices: ApiSalesInvoice[]
  summary?: ApiSalesSummary
  customers: ApiCustomer[]
  filters: SalesInvoiceFilters
  onFilterChange: (filters: SalesInvoiceFilters) => void
  isLoading: boolean
  onSelect: (id: number) => void
  /** Invoice yang detailnya sedang terbuka, disorot di tabel. */
  selectedId: number | null
}

/** Pilihan status yang dapat disaring, memakai nilai yang dipakai backend. */
const statusOptions = [
  { value: '', label: 'Semua Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'unpaid', label: 'Belum Bayar' },
  { value: 'partial', label: 'Sebagian' },
  { value: 'paid', label: 'Lunas' },
  { value: 'cancelled', label: 'Dibatalkan' },
]

export function SalesInvoiceTable({
  invoices,
  summary,
  customers,
  filters,
  onFilterChange,
  isLoading,
  onSelect,
  selectedId,
}: Props) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Total Penjualan" value={toAmount(summary?.total_sales)} />
        <MiniStat label="DP & Pembayaran Diterima" value={toAmount(summary?.received)} tone="green" />
        <MiniStat label="Piutang Terbuka" value={toAmount(summary?.open_receivable)} tone="amber" />
        <MiniStat
          label="Invoice Jatuh Tempo"
          value={`${summary?.overdue_count ?? 0} Invoice`}
          tone="red"
        />
      </div>

      <Card>
        {/* Kotak pencarian terisi sendiri bila halaman dibuka dari tautan
            nomor dokumen di Jurnal Umum, supaya terlihat kenapa daftarnya
            tersaring dan filternya dapat dihapus. */}
        <FilterBar
          searchValue={filters.search}
          searchPlaceholder="Cari nomor invoice atau customer..."
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
            options={statusOptions}
            value={filters.status ?? ''}
            onChange={value => onFilterChange({ ...filters, status: value || undefined })}
          />
        </FilterBar>

        {invoices.length === 0 && !isLoading ? (
          <EmptyState
            title="Belum ada invoice"
            description="Buat invoice pertama lewat tombol Buat Invoice di kanan atas."
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <th>No. Invoice</th>
                <th>Tanggal</th>
                <th>Customer</th>
                <th>Produk</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Total</th>
                <th className="text-right">Diterima</th>
                <th className="text-right">Sisa</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(invoice => (
                <InvoiceRow
                  key={invoice.id}
                  invoice={invoice}
                  isSelected={invoice.id === selectedId}
                  onSelect={() => onSelect(invoice.id)}
                />
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>
    </>
  )
}

type RowProps = {
  invoice: ApiSalesInvoice
  isSelected: boolean
  onSelect: () => void
}

function InvoiceRow({ invoice, isSelected, onSelect }: RowProps) {
  const items = invoice.items ?? []
  const products = items.map(item => item.product?.name).filter(Boolean).join(', ')
  const quantity = items.reduce((total, item) => total + toAmount(item.quantity), 0)

  return (
    <tr onClick={onSelect} className={cn('cursor-pointer', isSelected && 'bg-blue-50/60')}>
      <td className="font-semibold text-blue-700">{invoice.number}</td>
      <td>{formatDate(invoice.date)}</td>
      <td className="font-semibold">{invoice.customer?.name}</td>
      <td>{products}</td>
      <td className="money">{formatKg(quantity)}</td>
      <td className="money">{formatCurrency(toAmount(invoice.total))}</td>
      <td className="money">{formatCurrencyOrDash(toAmount(invoice.paid_amount))}</td>
      <td className="money">{formatCurrency(toAmount(invoice.outstanding_amount))}</td>
      <td>
        <Status tone={documentStatusTone[invoice.display_status]}>
          {invoice.display_status_label}
        </Status>
      </td>
    </tr>
  )
}
