import type {
  ApiAssetType,
  ApiDepreciationSchedule,
  ApiFixedAsset,
  Collection,
  FixedAssetPayload,
  Resource,
} from '@/types'
import { http, query } from './httpClient'

export const assetService = {
  async types(): Promise<ApiAssetType[]> {
    const { data } = await http.get<Collection<ApiAssetType>>('/asset-types')
    return data
  },

  async list(filters: { assetTypeId?: number; status?: string } = {}): Promise<ApiFixedAsset[]> {
    const { data } = await http.get<Collection<ApiFixedAsset>>(
      `/fixed-assets${query({ asset_type_id: filters.assetTypeId, status: filters.status })}`,
    )
    return data
  },

  async show(id: number): Promise<ApiFixedAsset> {
    const { data } = await http.get<Resource<ApiFixedAsset>>(`/fixed-assets/${id}`)
    return data
  },

  async create(payload: FixedAssetPayload): Promise<ApiFixedAsset> {
    const { data } = await http.post<Resource<ApiFixedAsset>>('/fixed-assets', payload)
    return data
  },

  async update(id: number, payload: FixedAssetPayload): Promise<ApiFixedAsset> {
    const { data } = await http.put<Resource<ApiFixedAsset>>(`/fixed-assets/${id}`, payload)
    return data
  },

  async dispose(id: number, payload: { date: string; proceeds?: string; cash_account_id?: number | null }) {
    const { data } = await http.post<Resource<ApiFixedAsset>>(`/fixed-assets/${id}/dispose`, payload)
    return data
  },

  async schedule(year: number): Promise<ApiDepreciationSchedule> {
    const { data } = await http.get<Resource<ApiDepreciationSchedule>>(`/fixed-assets/schedule${query({ year })}`)
    return data
  },

  async runDepreciation(year: number, month: number) {
    const { data } = await http.post<Resource<{ count: number; total: string }>>('/fixed-assets/depreciations', { year, month })
    return data
  },

  undoDepreciation(year: number, month: number) {
    return http.del<{ message: string }>(`/fixed-assets/depreciations${query({ year, month })}`)
  },
}
