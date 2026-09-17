import type { PaymentStatus } from './common'

/**
 * Satu kartu utang atau piutang.
 *
 * Kartu ini dibentuk otomatis dari tagihan pembelian / invoice penjualan
 * kredit, bukan diinput ulang oleh Finance.
 */
export type SubledgerCard = {
  number: string
  /** Kreditur untuk utang, debitur untuk piutang. */
  party: string
  date: string
  dueDate: string
  amount: number
  paid: number
  status: PaymentStatus
}

/** Pemegang saham dan hasil perhitungan alokasi dividennya. */
export type ShareholderAllocation = {
  name: string
  shares: number
  sharePercentage: string
  gross: number
  tax: number
  net: number
}

/** Satu keputusan pembagian laba yang sudah tercatat. */
export type DividendHistory = {
  period: string
  decisionDate: string
  profit: number
  distributed: number
  status: string
}
