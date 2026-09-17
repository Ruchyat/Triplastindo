import type { DividendHistory, ShareholderAllocation } from '@/types'

/** Komposisi 3.600.000 lembar saham dan simulasi dividen Rp 100.000.000. */
export const shareholderAllocations: ShareholderAllocation[] = [
  {
    name: 'Koh Yadie',
    shares: 1_440_000,
    sharePercentage: '40,00%',
    gross: 40_000_000,
    tax: 4_000_000,
    net: 36_000_000,
  },
  {
    name: 'Pak Satria',
    shares: 1_200_000,
    sharePercentage: '33,33%',
    gross: 33_330_000,
    tax: 3_333_000,
    net: 29_997_000,
  },
  {
    name: 'Koh Apin',
    shares: 760_000,
    sharePercentage: '21,11%',
    gross: 21_110_000,
    tax: 2_111_000,
    net: 18_999_000,
  },
  {
    name: 'Pak Andri',
    shares: 200_000,
    sharePercentage: '5,56%',
    gross: 5_560_000,
    tax: 556_000,
    net: 5_004_000,
  },
]

/**
 * Check point pembagian laba: kas akhir harus di atas minimum cash
 * sebelum laba boleh dibagikan.
 */
export const profitSharingCheckpoint = {
  closingCash: 312_650_000,
  minimumCash: 200_000_000,
  safe: true,
  netProfit: 382_000_000,
}

export const dividendHistory: DividendHistory[] = [
  {
    period: 'Juni 2026',
    decisionDate: '05 Juli 2026',
    profit: 394_192_550,
    distributed: 100_000_000,
    status: 'Approved',
  },
]
