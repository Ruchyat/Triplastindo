import type { ApiExpense, ApiExpenseSummary, ExpensePayload, Paginated, Resource } from '@/types'
import { http, query } from './httpClient'

/** Penyaring daftar pengeluaran. */
export type ExpenseFilters = {
  from?: string
  to?: string
  expenseAccountId?: number
  cashAccountId?: number
  status?: string
  search?: string
  page?: number
}

const toQuery = (filters: ExpenseFilters) => ({
  from: filters.from,
  to: filters.to,
  expense_account_id: filters.expenseAccountId,
  cash_account_id: filters.cashAccountId,
  status: filters.status,
  search: filters.search,
  page: filters.page,
})

export const expenseService = {
  list(filters: ExpenseFilters = {}) {
    return http.get<Paginated<ApiExpense>>(`/expenses${query(toQuery(filters))}`)
  },

  async summary(filters: ExpenseFilters = {}): Promise<ApiExpenseSummary> {
    const { data } = await http.get<Resource<ApiExpenseSummary>>(
      `/expenses/summary${query(toQuery(filters))}`,
    )
    return data
  },

  async show(id: number): Promise<ApiExpense> {
    const { data } = await http.get<Resource<ApiExpense>>(`/expenses/${id}`)
    return data
  },

  /** Mencatat pengeluaran. Backend membentuk jurnalnya: beban bertambah, kas berkurang. */
  async create(payload: ExpensePayload): Promise<ApiExpense> {
    const { data } = await http.post<Resource<ApiExpense>>('/expenses', payload)
    return data
  },

  async cancel(id: number): Promise<ApiExpense> {
    const { data } = await http.post<Resource<ApiExpense>>(`/expenses/${id}/cancel`)
    return data
  },
}
