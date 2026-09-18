import { useCallback, useState } from 'react'
import { useAsync } from '@/hooks/useAsync'
import { depositService, type DepositFilters } from '@/services/depositService'

/**
 * Posisi deposit per customer beserta ringkasan seluruhnya.
 *
 * Saldo deposit adalah pertanyaan per customer, bukan per tanggal — karena itu
 * inilah tampilan utama halaman Deposit, dan riwayat mutasinya baru dibuka
 * setelah satu customer dipilih.
 */
export function useDepositBalances() {
  const [filters, setFilters] = useState<DepositFilters>({})

  const load = useCallback(
    () => Promise.all([depositService.balances(filters), depositService.summary()]),
    [filters],
  )

  const { data, isLoading, error, reload } = useAsync(load)

  return {
    balances: data?.[0] ?? [],
    summary: data?.[1],
    isLoading,
    error,
    reload,
    filters,
    setFilters,
  }
}
