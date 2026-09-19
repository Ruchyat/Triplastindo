import { useCallback, useState } from 'react'
import { useAsync } from '@/hooks/useAsync'
import { monthEnd, monthStart } from '@/lib'
import { expenseService, type ExpenseFilters } from '@/services/expenseService'


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
