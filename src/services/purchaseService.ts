import type {
  ApiPurchaseBill,
  ApiPurchaseSummary,
  Paginated,
  PurchaseBillPayload,
  Resource,
} from '@/types'
import { http, query } from './httpClient'

/** Penyaring daftar tagihan pembelian. */
export type PurchaseFilters = {
  from?: string
  to?: string
  supplierId?: number
  category?: string
  status?: string
  search?: string
  page?: number
  perPage?: number
}

const toQuery = (filters: PurchaseFilters) => ({
  from: filters.from,
  to: filters.to,
  supplier_id: filters.supplierId,
  category: filters.category,
  status: filters.status,
  search: filters.search,
  page: filters.page,
  per_page: filters.perPage,
})

export const purchaseService = {
  list(filters: PurchaseFilters = {}) {
    return http.get<Paginated<ApiPurchaseBill>>(`/purchase-bills${query(toQuery(filters))}`)
  },

  async summary(filters: PurchaseFilters = {}): Promise<ApiPurchaseSummary> {
    const { data } = await http.get<Resource<ApiPurchaseSummary>>(
      `/purchase-bills/summary${query(toQuery(filters))}`,
    )
    return data
  },

  async show(id: number): Promise<ApiPurchaseBill> {
    const { data } = await http.get<Resource<ApiPurchaseBill>>(`/purchase-bills/${id}`)
    return data
  },

  /** Membuat tagihan. Jurnalnya dibentuk backend kecuali `post: false`. */
  async create(payload: PurchaseBillPayload): Promise<ApiPurchaseBill> {
    const { data } = await http.post<Resource<ApiPurchaseBill>>('/purchase-bills', payload)
    return data
  },

  async post(id: number): Promise<ApiPurchaseBill> {
    const { data } = await http.post<Resource<ApiPurchaseBill>>(`/purchase-bills/${id}/post`)
    return data
  },

  /** Membatalkan tagihan; backend membentuk jurnal pembaliknya. */
  async cancel(id: number): Promise<ApiPurchaseBill> {
    const { data } = await http.post<Resource<ApiPurchaseBill>>(`/purchase-bills/${id}/cancel`)
    return data
  },

  remove(id: number) {
    return http.del<{ message: string }>(`/purchase-bills/${id}`)
  },
}
