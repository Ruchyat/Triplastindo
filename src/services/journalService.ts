import type {
  ApiJournalEntry,
  ApiJournalSummary,
  Paginated,
  Resource,
} from '@/types'
import { http, query } from './httpClient'

/** Penyaring daftar Jurnal Umum. */
export type JournalFilters = {
  from?: string
  to?: string
  accountId?: number
  tagging?: string
  source?: string
  search?: string
  page?: number
  perPage?: number
}

const toQuery = (filters: JournalFilters) => ({
  from: filters.from,
  to: filters.to,
  account_id: filters.accountId,
  tagging: filters.tagging,
  source: filters.source,
  search: filters.search,
  page: filters.page,
  per_page: filters.perPage,
})

export const journalService = {
  /** Daftar jurnal beserta barisnya, terbaru lebih dahulu. */
  list(filters: JournalFilters = {}) {
    return http.get<Paginated<ApiJournalEntry>>(`/journal-entries${query(toQuery(filters))}`)
  },

  /** Total debit, total kredit, dan jumlah jurnal untuk filter yang sama. */
  async summary(filters: JournalFilters = {}): Promise<ApiJournalSummary> {
    const { data } = await http.get<Resource<ApiJournalSummary>>(
      `/journal-entries/summary${query(toQuery(filters))}`,
    )
    return data
  },

  async show(id: number): Promise<ApiJournalEntry> {
    const { data } = await http.get<Resource<ApiJournalEntry>>(`/journal-entries/${id}`)
    return data
  },

  /** Menghapus jurnal manual. Jurnal turunan dokumen ditolak backend. */
  remove(id: number) {
    return http.del<{ message: string }>(`/journal-entries/${id}`)
  },
}
