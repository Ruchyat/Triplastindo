import { useNavigate } from 'react-router-dom'
import { toPath } from '@/app/router'
import { InfoNote } from '@/components/common'
import type { ApiCustomer } from '@/types'
import { SalesInvoiceTable } from '../components/SalesInvoiceTable'
import { useSalesInvoices } from '../useSalesInvoices'

type Props = {
  sales: ReturnType<typeof useSalesInvoices>
  customers: ApiCustomer[]
  masterError: string | null
}

/** Tab Invoice Penjualan. Membuka satu invoice berpindah ke halamannya. */
export function InvoicesTab({ sales, customers, masterError }: Props) {
  const navigate = useNavigate()

  return (
    <>
      {(sales.error || masterError) && (
        <InfoNote tone="red">{sales.error ?? masterError}</InfoNote>
      )}

      <SalesInvoiceTable
        invoices={sales.invoices}
        summary={sales.summary}
        customers={customers}
        filters={sales.filters}
        onFilterChange={sales.setFilters}
        isLoading={sales.isLoading}
        onSelect={id => navigate(toPath.salesInvoice(id))}
        selectedId={null}
      />
    </>
  )
}
