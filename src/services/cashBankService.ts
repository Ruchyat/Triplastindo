import type {
  ApiCashAccountBalance,
  ApiCashMutation,
  ApiCashTransfer,
  CashTransferPayload,
  Paginated,
  Resource,
} from '@/types'
import { http, query } from './httpClient'

export type CashMutationFilters = {
  from?: string
  to?: string
  accountId?: number
  page?: number
}

export type CashTransferFilters = {
  from?: string
  to?: string
  accountId?: number
  status?: string
  search?: string
  page?: number
}

export const cashBankService = {
  /** Saldo tiap akun kas/bank per tanggal (bawaan hari ini), beserta totalnya. */
  balances(asOf?: string) {
    return http.get<{ data: ApiCashAccountBalance[]; meta: { as_of: string; total_balance: string } }>(
      `/cash-accounts${query({ as_of: asOf })}`,
    )
  },

  /** Mutasi seluruh akun kas/bank, dari modul mana pun asalnya. */
  mutations(filters: CashMutationFilters = {}) {
    return http.get<Paginated<ApiCashMutation>>(
      `/cash-mutations${query({
        from: filters.from,
        to: filters.to,
        account_id: filters.accountId,
        page: filters.page,
      })}`,
    )
  },

  transfers(filters: CashTransferFilters = {}) {
    return http.get<Paginated<ApiCashTransfer>>(
      `/cash-transfers${query({
        from: filters.from,
        to: filters.to,
        account_id: filters.accountId,
        status: filters.status,
        search: filters.search,
        page: filters.page,
      })}`,
    )
  },

  async transfer(id: number): Promise<ApiCashTransfer> {
    const { data } = await http.get<Resource<ApiCashTransfer>>(`/cash-transfers/${id}`)
    return data
  },

  async createTransfer(payload: CashTransferPayload): Promise<ApiCashTransfer> {
    const { data } = await http.post<Resource<ApiCashTransfer>>('/cash-transfers', payload)
    return data
  },

  async cancelTransfer(id: number): Promise<ApiCashTransfer> {
    const { data } = await http.post<Resource<ApiCashTransfer>>(`/cash-transfers/${id}/cancel`)
    return data
  },
}
