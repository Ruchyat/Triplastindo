import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { routePaths, toPath } from '@/app/router'
import { MiniStat } from '@/components/common'
import { SubledgerView, type SubledgerFilters } from '@/features/subledger/components/SubledgerView'
import { useAsync } from '@/hooks/useAsync'
import { toAmount } from '@/lib'
import { masterDataService } from '@/services/masterDataService'
import { salesService } from '@/services/salesService'
import type { ApiSalesInvoice } from '@/types'

/** Kartu piutang per customer beserta umur piutangnya. */
export function ReceivablesPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<SubledgerFilters>({ status: 'outstanding' })

  const load = useCallback(
    () =>
      Promise.all([
        salesService.list({
          customerId: filters.partyId,
          status: filters.status || undefined,
          perPage: 100,
        }),
        salesService.summary({ customerId: filters.partyId }),
      ]),
    [filters],
  )
  const { data, isLoading, error } = useAsync(load)

  const loadCustomers = useCallback(() => masterDataService.customers(), [])
  const customers = useAsync(loadCustomers).data ?? []

  const summary = data?.[1]
  const invoices = (data?.[0].data ?? []).filter(invoice => invoice.status !== 'draft')

  const aging = useMemo(() => ageReceivables(invoices), [invoices])

  return (
    <SubledgerView
      kind="receivable"
      summary={
        summary && {
          total: toAmount(summary.total_sales),
          settled: toAmount(summary.received),
          outstanding: toAmount(summary.open_receivable),
        }
      }
      rows={invoices.map(invoice => ({
        id: invoice.id,
        number: invoice.number,
        party: invoice.customer?.name ?? '–',
        date: invoice.date,
        dueDate: invoice.due_date,
        amount: toAmount(invoice.total),
        paid: toAmount(invoice.paid_amount),
        status: invoice.display_status,
        statusLabel: invoice.display_status_label,
      }))}
      isLoading={isLoading}
      error={error}
      parties={customers.map(customer => ({
        value: String(customer.id),
        label: customer.name,
        description: customer.code,
      }))}
      filters={filters}
      onFilterChange={setFilters}
      onOpen={id => navigate(toPath.salesInvoice(id))}
      onSettle={row => {
        const invoice = invoices.find(candidate => candidate.id === row.id)
        navigate(toPath.receiptNew({ customerId: invoice?.customer?.id, invoiceId: row.id }))
      }}
      sourcePath={routePaths.sales}
      aging={
        <div className="grid gap-3 sm:grid-cols-4">
          {aging.map(bucket => (
            <MiniStat
              key={bucket.label}
              label={bucket.label}
              value={bucket.amount}
              tone={bucket.amount === 0 ? 'green' : 'amber'}
            />
          ))}
        </div>
      }
    />
  )
}

/**
 * Umur piutang dari sisa tiap invoice yang belum lunas, dihitung dari jatuh
 * temponya terhadap hari ini. Invoice tanpa jatuh tempo dianggap belum jatuh
 * tempo.
 */
function ageReceivables(invoices: ApiSalesInvoice[]) {
  const buckets = [
    { label: 'Belum Jatuh Tempo', amount: 0 },
    { label: '1–30 Hari', amount: 0 },
    { label: '31–60 Hari', amount: 0 },
    { label: '> 60 Hari', amount: 0 },
  ]
  const today = Date.now()

  for (const invoice of invoices) {
    if (invoice.status !== 'unpaid' && invoice.status !== 'partial') continue
    const outstanding = toAmount(invoice.outstanding_amount)
    const overdueDays = invoice.due_date
      ? Math.floor((today - new Date(invoice.due_date).getTime()) / 86_400_000)
      : 0

    const index = overdueDays <= 0 ? 0 : overdueDays <= 30 ? 1 : overdueDays <= 60 ? 2 : 3
    buckets[index].amount += outstanding
  }

  return buckets
}
