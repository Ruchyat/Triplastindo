import type {
  ApiEmployee,
  ApiFiscalPeriod,
  ApiJournalEntry,
  ApiSettings,
  ApiShareholder,
  ApiUser,
  Collection,
  EmployeePayload,
  OpeningBalancePayload,
  Resource,
  UserPayload,
} from '@/types'
import { http, query } from './httpClient'

/** Pengaturan, periode buku, saldo awal, pengguna, karyawan, pemegang saham. */
export const setupService = {
  async settings(): Promise<ApiSettings> {
    const { data } = await http.get<Resource<ApiSettings>>('/settings')
    return data
  },

  async updateSettings(payload: Partial<ApiSettings>): Promise<ApiSettings> {
    const { data } = await http.put<Resource<ApiSettings>>('/settings', payload)
    return data
  },

  async fiscalPeriods(year: number): Promise<ApiFiscalPeriod[]> {
    const { data } = await http.get<Collection<ApiFiscalPeriod>>(`/fiscal-periods${query({ year })}`)
    return data
  },

  async closePeriod(year: number, month: number): Promise<ApiFiscalPeriod[]> {
    const { data } = await http.post<Collection<ApiFiscalPeriod>>('/fiscal-periods/close', { year, month })
    return data
  },

  async reopenPeriod(year: number, month: number): Promise<ApiFiscalPeriod[]> {
    const { data } = await http.post<Collection<ApiFiscalPeriod>>('/fiscal-periods/reopen', { year, month })
    return data
  },

  async openingBalances(): Promise<ApiJournalEntry[]> {
    const { data } = await http.get<Collection<ApiJournalEntry>>('/opening-balances')
    return data
  },

  async createOpeningBalance(payload: OpeningBalancePayload): Promise<ApiJournalEntry> {
    const { data } = await http.post<Resource<ApiJournalEntry>>('/opening-balances', payload)
    return data
  },

  async users(): Promise<ApiUser[]> {
    const { data } = await http.get<Collection<ApiUser>>('/users')
    return data
  },

  async roles(): Promise<{ value: ApiUser['role']; label: string }[]> {
    const { data } = await http.get<Collection<{ value: ApiUser['role']; label: string }>>('/user-roles')
    return data
  },

  async createUser(payload: UserPayload): Promise<ApiUser> {
    const { data } = await http.post<Resource<ApiUser>>('/users', payload)
    return data
  },

  async updateUser(id: number, payload: UserPayload): Promise<ApiUser> {
    const { data } = await http.put<Resource<ApiUser>>(`/users/${id}`, payload)
    return data
  },

  async employees(options: { includeInactive?: boolean; withLoan?: boolean } = {}): Promise<ApiEmployee[]> {
    const { data } = await http.get<Collection<ApiEmployee>>(
      `/employees${query({ is_active: options.includeInactive ? undefined : true, with_loan: options.withLoan })}`,
    )
    return data
  },

  async createEmployee(payload: EmployeePayload): Promise<ApiEmployee> {
    const { data } = await http.post<Resource<ApiEmployee>>('/employees', payload)
    return data
  },

  async updateEmployee(id: number, payload: EmployeePayload): Promise<ApiEmployee> {
    const { data } = await http.put<Resource<ApiEmployee>>(`/employees/${id}`, payload)
    return data
  },

  async shareholders(): Promise<{ data: ApiShareholder[]; total: number }> {
    const res = await http.get<{ data: ApiShareholder[]; meta: { total_shares: number } }>('/shareholders')
    return { data: res.data, total: res.meta.total_shares }
  },

  async createShareholder(payload: { name: string; shares: number; user_id?: number | null; is_active?: boolean }) {
    const { data } = await http.post<Resource<ApiShareholder>>('/shareholders', payload)
    return data
  },

  async updateShareholder(id: number, payload: { name: string; shares: number; user_id?: number | null; is_active?: boolean }) {
    const { data } = await http.put<Resource<ApiShareholder>>(`/shareholders/${id}`, payload)
    return data
  },
}
