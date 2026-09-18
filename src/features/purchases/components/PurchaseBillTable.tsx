import {
  Card,
  EmptyState,
  FilterBar,
  Combobox,
  MiniStat,
  Status,
  TableWrap,
} from '@/components/common'
import { cn, formatCurrency, formatCurrencyOrDash, formatDate, toAmount } from '@/lib'
import type { PurchaseFilters } from '@/services/purchaseService'
import {
  documentStatusTone,
  type ApiPurchaseBill,
  type ApiPurchaseCategory,
  type ApiPurchaseSummary,
  type ApiSupplier,
} from '@/types'

type Props = {
  bills: ApiPurchaseBill[]
  summary?: ApiPurchaseSummary
  suppliers: ApiSupplier[]
  categories: ApiPurchaseCategory[]
  filters: PurchaseFilters
  onFilterChange: (filters: PurchaseFilters) => void
  isLoading: boolean
  onSelect: (id: number) => void
}

const statusOptions = [
  { value: '', label: 'Semua Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'unpaid', label: 'Belum Bayar' },
  { value: 'partial', label: 'Sebagian' },
  { value: 'paid', label: 'Lunas' },
  { value: 'cancelled', label: 'Dibatalkan' },
]

/** Daftar tagihan pembelian. */
export function PurchaseBillTable({
  bills,
  summary,
  suppliers,
  categories,
  filters,
  onFilterChange,
  isLoading,
  onSelect,
}: Props) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Total Pembelian" value={toAmount(summary?.total_purchases)} />
        <MiniStat label="Sudah Dibayar" value={toAmount(summary?.paid)} tone="green" />
        <MiniStat label="Utang Terbuka" value={toAmount(summary?.open_payable)} tone="amber" />
        <MiniStat
          label="Tagihan Jatuh Tempo"
          value={`${summary?.overdue_count ?? 0} Tagihan`}
          tone="red"
        />
      </div>

      <Card>
        <FilterBar
          searchValue={filters.search}
          searchPlaceholder="Cari nomor tagihan, nota, atau supplier..."
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
            className="w-48"
            aria-label="Filter kategori"
            options={[{ value: '', label: 'Semua Kategori' }, ...categories]}
            value={filters.category ?? ''}
            onChange={value => onFilterChange({ ...filters, category: value || undefined })}
          />

          <Combobox
            className="w-44"
            aria-label="Filter status"
            options={statusOptions}
            value={filters.status ?? ''}
            onChange={value => onFilterChange({ ...filters, status: value || undefined })}
          />
        </FilterBar>

        {bills.length === 0 && !isLoading ? (
          <EmptyState
            title="Belum ada tagihan pembelian"
            description="Catat pembelian lewat tombol Buat Tagihan di kanan atas."
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <th>No. Tagihan</th>
                <th>Tanggal</th>
                <th>Supplier</th>
                <th>Kategori</th>
                <th>Item</th>
                <th className="text-right">Total</th>
                <th className="text-right">Dibayar</th>
                <th className="text-right">Sisa</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bills.map(bill => (
                <tr key={bill.id} onClick={() => onSelect(bill.id)} className={cn('cursor-pointer')}>
                  <td className="font-semibold text-blue-700">
                    {bill.number}
                    {bill.supplier_invoice_number && (
                      <span className="block text-[10px] font-normal text-slate-400">
                        {bill.supplier_invoice_number}
                      </span>
                    )}
                  </td>
                  <td>{formatDate(bill.date)}</td>
                  <td className="font-semibold">{bill.supplier?.name}</td>
                  <td className="text-slate-500">{bill.category_label}</td>
                  <td className="text-slate-500">
                    {(bill.items ?? []).map(item => item.label).join(', ')}
                  </td>
                  <td className="money">{formatCurrency(toAmount(bill.total))}</td>
                  <td className="money">{formatCurrencyOrDash(toAmount(bill.paid_amount))}</td>
                  <td className="money">{formatCurrency(toAmount(bill.outstanding_amount))}</td>
                  <td>
                    <Status tone={documentStatusTone[bill.display_status]}>
                      {bill.display_status_label}
                    </Status>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>
    </>
  )
}
