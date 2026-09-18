import { useCallback, useState } from 'react'
import { useAsync } from '@/hooks/useAsync'
import { expenseService, type ExpenseFilters } from '@/services/expenseService'

const monthStart = () => new Date().toISOString().slice(0, 8) + '01'
const monthEnd = () => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
}

/** Daftar pengeluaran beserta ringkasannya. Bawaannya bulan berjalan. */
export function useExpenses() {
  const [filters, setFilters] = useState<ExpenseFilters>({ from: monthStart(), to: monthEnd() })

  const load = useCallback(
    () => Promise.all([expenseService.list(filters), expenseService.summary(filters)]),
    [filters],
  )
  const { data, isLoading, error, reload } = useAsync(load)

  return {
    expenses: data?.[0].data ?? [],
    meta: data?.[0].meta,
    summary: data?.[1],
    isLoading,
    error,
    reload,
    filters,
    setFilters,
  }
}
