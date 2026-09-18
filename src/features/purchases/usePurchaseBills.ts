import { useCallback, useState } from 'react'
import { useAsync } from '@/hooks/useAsync'
import { purchaseService, type PurchaseFilters } from '@/services/purchaseService'

/** Daftar tagihan pembelian beserta ringkasannya. */
export function usePurchaseBills() {
  const [filters, setFilters] = useState<PurchaseFilters>({})

  const load = useCallback(
    () => Promise.all([purchaseService.list(filters), purchaseService.summary(filters)]),
    [filters],
  )

  const { data, isLoading, error, reload } = useAsync(load)

  return {
    bills: data?.[0].data ?? [],
    meta: data?.[0].meta,
    summary: data?.[1],
    isLoading,
    error,
    reload,
    filters,
    setFilters,
  }
}
