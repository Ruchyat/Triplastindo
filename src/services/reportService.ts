import type { ApiBalanceSheet, ApiCashFlow, ApiDashboard, ApiProfitLoss, Resource } from '@/types'
import { http, query } from './httpClient'

/** Periode laporan: satu bulan pada satu tahun. */
export type ReportPeriod = { year: number; month: number }

/** Laba Rugi dan Arus Kas datang dua kolom sekaligus: bulan itu dan YTD. */
type Columns<T> = { period: T; ytd: T }

export const reportService = {
  async profitLoss(period: ReportPeriod): Promise<Columns<ApiProfitLoss>> {
    const { data } = await http.get<Resource<Columns<ApiProfitLoss>>>(
      `/reports/profit-loss${query(period)}`,
    )
    return data
  },

  async balanceSheet(period: ReportPeriod): Promise<ApiBalanceSheet> {
    const { data } = await http.get<Resource<ApiBalanceSheet>>(
      `/reports/balance-sheet${query(period)}`,
    )
    return data
  },

  async cashFlow(period: ReportPeriod): Promise<Columns<ApiCashFlow> & { balance_sheet_cash: string }> {
    const { data } = await http.get<
      Resource<Columns<ApiCashFlow> & { balance_sheet_cash: string }>
    >(`/reports/cash-flow${query(period)}`)
    return data
  },

  async dashboard(period: ReportPeriod): Promise<ApiDashboard> {
    const { data } = await http.get<Resource<ApiDashboard>>(`/dashboard${query(period)}`)
    return data
  },
}
