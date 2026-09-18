import type {
  ApiPaymentReceipt,
  Paginated,
  PaymentReceiptPayload,
  Resource,
} from '@/types'
import { http, query } from './httpClient'

/** Penyaring daftar penerimaan pembayaran. */
export type ReceiptFilters = {
  from?: string
  to?: string
  customerId?: number
  status?: string
  search?: string
  page?: number
}

export const receiptService = {
  list(filters: ReceiptFilters = {}) {
    return http.get<Paginated<ApiPaymentReceipt>>(
      `/payment-receipts${query({
        from: filters.from,
        to: filters.to,
        customer_id: filters.customerId,
        status: filters.status,
        search: filters.search,
        page: filters.page,
      })}`,
    )
  },

  async show(id: number): Promise<ApiPaymentReceipt> {
    const { data } = await http.get<Resource<ApiPaymentReceipt>>(`/payment-receipts/${id}`)
    return data
  },

  /** Mencatat penerimaan. Backend membentuk jurnalnya dan memutakhirkan piutang. */
  async create(payload: PaymentReceiptPayload): Promise<ApiPaymentReceipt> {
    const { data } = await http.post<Resource<ApiPaymentReceipt>>('/payment-receipts', payload)
    return data
  },

  /** Membatalkan penerimaan; jurnalnya dibalik dan piutangnya dikembalikan. */
  async cancel(id: number): Promise<ApiPaymentReceipt> {
    const { data } = await http.post<Resource<ApiPaymentReceipt>>(`/payment-receipts/${id}/cancel`)
    return data
  },
}
