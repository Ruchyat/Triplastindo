import { useCallback, useState } from 'react'
import { useAsync } from '@/hooks/useAsync'
import { receiptService, type ReceiptFilters } from '@/services/receiptService'

/** Daftar bukti penerimaan pembayaran. */
export function useReceipts() {
  const [filters, setFilters] = useState<ReceiptFilters>({})

  const load = useCallback(() => receiptService.list(filters), [filters])
  const { data, isLoading, error, reload } = useAsync(load)

  return {
    receipts: data?.data ?? [],
    meta: data?.meta,
    isLoading,
    error,
    reload,
    filters,
    setFilters,
  }
}
