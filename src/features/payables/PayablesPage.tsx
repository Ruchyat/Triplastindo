import { useCallback, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { routePaths, toPath } from '@/app/router'
import { SubledgerView, type SubledgerFilters } from '@/features/subledger/components/SubledgerView'
import { useAsync } from '@/hooks/useAsync'
import { toAmount } from '@/lib'
import { masterDataService } from '@/services/masterDataService'
import { purchaseService } from '@/services/purchaseService'

/** Kartu utang per supplier, dibentuk dari tagihan pembelian bertermin. */
export function PayablesPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [filters, setFilters] = useState<SubledgerFilters>({
    status: 'outstanding',
    partyId: Number(params.get('supplier')) || undefined,
  })

  const load = useCallback(
    () =>
      Promise.all([
        purchaseService.list({
          supplierId: filters.partyId,
          status: filters.status || undefined,
          perPage: 100,
        }),
        purchaseService.summary({ supplierId: filters.partyId }),
      ]),
    [filters],
  )
  const { data, isLoading, error } = useAsync(load)

  const loadSuppliers = useCallback(() => masterDataService.suppliers(), [])
  const suppliers = useAsync(loadSuppliers).data ?? []

  const summary = data?.[1]
  const bills = (data?.[0].data ?? []).filter(bill => bill.status !== 'draft')

  return (
    <SubledgerView
      kind="payable"
      summary={
        summary && {
          total: toAmount(summary.total_purchases),
          settled: toAmount(summary.paid),
          outstanding: toAmount(summary.open_payable),
        }
      }
      rows={bills.map(bill => ({
        id: bill.id,
        number: bill.number,
        party: bill.supplier?.name ?? '–',
        date: bill.date,
        dueDate: bill.due_date,
        amount: toAmount(bill.total),
        paid: toAmount(bill.paid_amount),
        status: bill.display_status,
        statusLabel: bill.display_status_label,
      }))}
      isLoading={isLoading}
      error={error}
      parties={suppliers.map(supplier => ({
        value: String(supplier.id),
        label: supplier.name,
        description: supplier.code,
      }))}
      filters={filters}
      onFilterChange={setFilters}
      onOpen={id => navigate(toPath.purchaseBill(id))}
      onSettle={row => {
        const bill = bills.find(candidate => candidate.id === row.id)
        navigate(toPath.supplierPaymentNew({ supplierId: bill?.supplier?.id, billId: row.id }))
      }}
      sourcePath={routePaths.purchases}
    />
  )
}
