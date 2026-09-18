import type {
  ApiSalesInvoice,
  ApiSalesSummary,
  Paginated,
  Resource,
  SalesInvoicePayload,
} from '@/types'
import { http, query } from './httpClient'

/** Penyaring daftar invoice penjualan. */
export type SalesInvoiceFilters = {
  from?: string
  to?: string
  customerId?: number
  status?: string
  search?: string
  page?: number
  perPage?: number
}

export const salesService = {
  /** Daftar invoice, terbaru lebih dahulu. */
  list(filters: SalesInvoiceFilters = {}) {
    return http.get<Paginated<ApiSalesInvoice>>(
      `/sales-invoices${query({
        from: filters.from,
        to: filters.to,
        customer_id: filters.customerId,
        status: filters.status,
        search: filters.search,
        page: filters.page,
        per_page: filters.perPage,
      })}`,
    )
  },

  /** Total penjualan, uang diterima, dan piutang terbuka untuk filter yang sama. */
  async summary(filters: SalesInvoiceFilters = {}): Promise<ApiSalesSummary> {
    const { data } = await http.get<Resource<ApiSalesSummary>>(
      `/sales-invoices/summary${query({
        from: filters.from,
        to: filters.to,
        customer_id: filters.customerId,
      })}`,
    )
    return data
  },

  async show(id: number): Promise<ApiSalesInvoice> {
    const { data } = await http.get<Resource<ApiSalesInvoice>>(`/sales-invoices/${id}`)
    return data
  },

  /** Membuat invoice. Jurnalnya dibentuk backend kecuali `post: false`. */
  async create(payload: SalesInvoicePayload): Promise<ApiSalesInvoice> {
    const { data } = await http.post<Resource<ApiSalesInvoice>>('/sales-invoices', payload)
    return data
  },

  /** Memposting invoice yang masih draft. */
  async post(id: number): Promise<ApiSalesInvoice> {
    const { data } = await http.post<Resource<ApiSalesInvoice>>(`/sales-invoices/${id}/post`)
    return data
  },

  /** Membatalkan invoice; backend membentuk jurnal pembaliknya. */
  async cancel(id: number): Promise<ApiSalesInvoice> {
    const { data } = await http.post<Resource<ApiSalesInvoice>>(`/sales-invoices/${id}/cancel`)
    return data
  },

  /** Menghapus invoice yang masih draft. */
  remove(id: number) {
    return http.del<{ message: string }>(`/sales-invoices/${id}`)
  },
}
