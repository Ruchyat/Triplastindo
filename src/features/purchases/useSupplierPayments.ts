import { useCallback, useState } from 'react'
import { useAsync } from '@/hooks/useAsync'
import {
  supplierPaymentService,
  type SupplierPaymentFilters,
} from '@/services/supplierPaymentService'

/** Daftar bukti pembayaran supplier. */
export function useSupplierPayments() {
  const [filters, setFilters] = useState<SupplierPaymentFilters>({})

  const load = useCallback(() => supplierPaymentService.list(filters), [filters])
  const { data, isLoading, error, reload } = useAsync(load)

  return {
    payments: data?.data ?? [],
    meta: data?.meta,
    isLoading,
    error,
    reload,
    filters,
    setFilters,
  }
}
