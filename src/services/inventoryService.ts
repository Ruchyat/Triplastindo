import type { ApiInventorySummary, ApiStockMovement, Paginated, Resource, StockMovementPayload } from '@/types'
import { http, query } from './httpClient'

export const inventoryService = {
  async summary(year: number): Promise<ApiInventorySummary> {
    const { data } = await http.get<Resource<ApiInventorySummary>>(`/inventory/summary${query({ year })}`)
    return data
  },

  movements(filters: { productId?: number; from?: string; to?: string; page?: number } = {}) {
    return http.get<Paginated<ApiStockMovement>>(
      `/stock-movements${query({ product_id: filters.productId, from: filters.from, to: filters.to, page: filters.page })}`,
    )
  },

  async create(payload: StockMovementPayload): Promise<ApiStockMovement> {
    const { data } = await http.post<Resource<ApiStockMovement>>('/stock-movements', payload)
    return data
  },

  remove(id: number) {
    return http.del<{ message: string }>(`/stock-movements/${id}`)
  },
}
