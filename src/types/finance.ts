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
