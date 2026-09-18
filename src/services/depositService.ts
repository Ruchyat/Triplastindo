import type {
  ApiCustomerDeposit,
  ApiDepositBalance,
  ApiDepositSummary,
  CustomerDepositPayload,
  Paginated,
  Resource,
} from '@/types'
import { http, query } from './httpClient'

/** Penyaring kartu deposit pelanggan. */
export type DepositFilters = {
  from?: string
  to?: string
  customerId?: number
  movement?: string
  status?: string
  search?: string
  page?: number
  perPage?: number
  /** Hanya customer yang saldonya masih di atas nol. */
  withBalance?: boolean
}

const toQuery = (filters: DepositFilters) => ({
  from: filters.from,
  to: filters.to,
  customer_id: filters.customerId,
  movement: filters.movement,
  status: filters.status,
  search: filters.search,
  page: filters.page,
  per_page: filters.perPage,
  with_balance: filters.withBalance,
})

export const depositService = {
  /** Posisi deposit per customer — tampilan utama halaman Deposit. */
  async balances(filters: DepositFilters = {}): Promise<ApiDepositBalance[]> {
    const { data } = await http.get<{ data: ApiDepositBalance[] }>(
      `/customer-deposits/customers${query(toQuery(filters))}`,
    )
    return data
  },

  /** Riwayat mutasi, dipakai kartu deposit satu customer. */
  list(filters: DepositFilters = {}) {
    return http.get<Paginated<ApiCustomerDeposit>>(`/customer-deposits${query(toQuery(filters))}`)
  },

  /** Saldo total, deposit masuk, dan yang terpakai atau dikembalikan. */
  async summary(filters: DepositFilters = {}): Promise<ApiDepositSummary> {
    const { data } = await http.get<Resource<ApiDepositSummary>>(
      `/customer-deposits/summary${query(toQuery(filters))}`,
    )
    return data
  },

  async show(id: number): Promise<ApiCustomerDeposit> {
    const { data } = await http.get<Resource<ApiCustomerDeposit>>(`/customer-deposits/${id}`)
    return data
  },

  /** Mencatat deposit masuk atau pengembalian deposit. */
  async create(payload: CustomerDepositPayload): Promise<ApiCustomerDeposit> {
    const { data } = await http.post<Resource<ApiCustomerDeposit>>('/customer-deposits', payload)
    return data
  },

  /** Membatalkan mutasi; jurnalnya dibalik dan saldonya kembali seperti semula. */
  async cancel(id: number): Promise<ApiCustomerDeposit> {
    const { data } = await http.post<Resource<ApiCustomerDeposit>>(`/customer-deposits/${id}/cancel`)
    return data
  },
}
