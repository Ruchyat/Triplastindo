import { useCallback, useState } from 'react'
import { useAsync } from '@/hooks/useAsync'
import { salesService, type SalesInvoiceFilters } from '@/services/salesService'

/**
 * Daftar invoice penjualan beserta ringkasannya.
 *
 * Ringkasan diambil terpisah dari backend, bukan dijumlahkan dari daftar yang
 * tampil, karena daftarnya dipaginasi.
 */
export function useSalesInvoices() {
  const [filters, setFilters] = useState<SalesInvoiceFilters>({})

  const load = useCallback(
    () => Promise.all([salesService.list(filters), salesService.summary(filters)]),
    [filters],
  )

  const { data, isLoading, error, reload } = useAsync(load)

  return {
    invoices: data?.[0].data ?? [],
    meta: data?.[0].meta,
    summary: data?.[1],
    isLoading,
    error,
    reload,
    filters,
    setFilters,
  }
}
