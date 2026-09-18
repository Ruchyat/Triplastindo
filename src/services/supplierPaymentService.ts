import type {
  ApiSupplierPayment,
  Paginated,
  Resource,
  SupplierPaymentPayload,
} from '@/types'
import { http, query } from './httpClient'

/** Penyaring daftar pembayaran supplier. */
export type SupplierPaymentFilters = {
  from?: string
  to?: string
  supplierId?: number
  status?: string
  search?: string
  page?: number
}

export const supplierPaymentService = {
  list(filters: SupplierPaymentFilters = {}) {
    return http.get<Paginated<ApiSupplierPayment>>(
      `/supplier-payments${query({
        from: filters.from,
        to: filters.to,
        supplier_id: filters.supplierId,
        status: filters.status,
        search: filters.search,
        page: filters.page,
      })}`,
    )
  },

  async show(id: number): Promise<ApiSupplierPayment> {
    const { data } = await http.get<Resource<ApiSupplierPayment>>(`/supplier-payments/${id}`)
    return data
  },

  /** Mencatat pembayaran. Backend membentuk jurnalnya dan memutakhirkan utang. */
  async create(payload: SupplierPaymentPayload): Promise<ApiSupplierPayment> {
    const { data } = await http.post<Resource<ApiSupplierPayment>>('/supplier-payments', payload)
    return data
  },

  /** Membatalkan pembayaran; jurnalnya dibalik dan utangnya dikembalikan. */
  async cancel(id: number): Promise<ApiSupplierPayment> {
    const { data } = await http.post<Resource<ApiSupplierPayment>>(
      `/supplier-payments/${id}/cancel`,
    )
    return data
  },
}
