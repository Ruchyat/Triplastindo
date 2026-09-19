import type { ApiPayrollRun, ApiPayrollSummary, Collection, PayrollAmountField, Resource } from '@/types'
import { http, query } from './httpClient'

export type PayrollItemPatch = { employee_id: number } & Partial<Record<PayrollAmountField, string>>

export const payrollService = {
  async list(year?: number): Promise<ApiPayrollRun[]> {
    const { data } = await http.get<Collection<ApiPayrollRun>>(`/payroll-runs${query({ year })}`)
    return data
  },

  async show(id: number): Promise<ApiPayrollRun> {
    const { data } = await http.get<Resource<ApiPayrollRun>>(`/payroll-runs/${id}`)
    return data
  },

  async create(payload: { year: number; month: number; payment_date: string; cash_account_id: number }) {
    const { data } = await http.post<Resource<ApiPayrollRun>>('/payroll-runs', payload)
    return data
  },

  async updateItems(id: number, items: PayrollItemPatch[]): Promise<ApiPayrollRun> {
    const { data } = await http.put<Resource<ApiPayrollRun>>(`/payroll-runs/${id}/items`, { items })
    return data
  },

  async removeItem(id: number, employeeId: number): Promise<ApiPayrollRun> {
    const { data } = await http.del<Resource<ApiPayrollRun>>(`/payroll-runs/${id}/items/${employeeId}`)
    return data
  },

  async post(id: number): Promise<ApiPayrollRun> {
    const { data } = await http.post<Resource<ApiPayrollRun>>(`/payroll-runs/${id}/post`)
    return data
  },

  async cancel(id: number): Promise<ApiPayrollRun> {
    const { data } = await http.post<Resource<ApiPayrollRun>>(`/payroll-runs/${id}/cancel`)
    return data
  },

  async summary(year: number): Promise<ApiPayrollSummary> {
    const { data } = await http.get<Resource<ApiPayrollSummary>>(`/payroll-runs/summary${query({ year })}`)
    return data
  },
}
