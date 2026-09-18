import { useNavigate } from 'react-router-dom'
import { toPath } from '@/app/router'
import { InfoNote } from '@/components/common'
import type { ApiCustomer } from '@/types'
import { ReceiptsTable } from '../components/ReceiptsTable'
import { useReceipts } from '../useReceipts'

type Props = {
  receipts: ReturnType<typeof useReceipts>
  customers: ApiCustomer[]
}

/** Tab Penerimaan Pembayaran. Membuka satu bukti berpindah ke halamannya. */
export function ReceiptsTab({ receipts, customers }: Props) {
  const navigate = useNavigate()

  return (
    <>
      {receipts.error && <InfoNote tone="red">{receipts.error}</InfoNote>}

      <ReceiptsTable
        receipts={receipts.receipts}
        customers={customers}
        filters={receipts.filters}
        onFilterChange={receipts.setFilters}
        isLoading={receipts.isLoading}
        onSelect={id => navigate(toPath.receipt(id))}
        selectedId={null}
      />
    </>
  )
}
