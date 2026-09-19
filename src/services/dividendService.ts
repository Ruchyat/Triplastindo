import type { ApiDividendCheckpoint, ApiDividendDecision, Collection, DividendPayload, Resource } from '@/types'
import { http, query } from './httpClient'

export const dividendService = {
  async checkpoints(year: number): Promise<ApiDividendCheckpoint[]> {
    const { data } = await http.get<Resource<{ year: number; months: ApiDividendCheckpoint[] }>>(
      `/dividend-decisions/checkpoints${query({ year })}`,
    )
    return data.months
  },

  async list(year?: number): Promise<ApiDividendDecision[]> {
    const { data } = await http.get<Collection<ApiDividendDecision>>(`/dividend-decisions${query({ year })}`)
    return data
  },

  async show(id: number): Promise<ApiDividendDecision> {
    const { data } = await http.get<Resource<ApiDividendDecision>>(`/dividend-decisions/${id}`)
    return data
  },

  async propose(payload: DividendPayload): Promise<ApiDividendDecision> {
    const { data } = await http.post<Resource<ApiDividendDecision>>('/dividend-decisions', payload)
    return data
  },

  async approve(id: number): Promise<ApiDividendDecision> {
    const { data } = await http.post<Resource<ApiDividendDecision>>(`/dividend-decisions/${id}/approve`)
    return data
  },

  async cancel(id: number): Promise<ApiDividendDecision> {
    const { data } = await http.post<Resource<ApiDividendDecision>>(`/dividend-decisions/${id}/cancel`)
    return data
  },
}
