import type { PeriodKey } from '@/types'

export const periodOptions: { value: PeriodKey; label: string }[] = [
  { value: 'sep', label: 'September 2026' },
  { value: 'jun', label: 'Juni 2026' },
  { value: 'ytd', label: 'YTD 2026' },
]

/** Ringkasan KPI satu periode. Semua nilai perubahan berupa pecahan, bukan persen. */
export type PeriodSummary = {
  label: string
  revenue: number
  expenses: number
  profit: number
  cash: number
  turnover: number
  expenseRatio: number
  npm: number
  revenueChange: number
  expenseChange: number
  profitChange: number
}

export const periodSummaries: Record<PeriodKey, PeriodSummary> = {
  sep: {
    label: 'September 2026',
    revenue: 1_920_000_000,
    expenses: 1_538_000_000,
    profit: 382_000_000,
    cash: 312_650_000,
    turnover: 0.31,
    expenseRatio: 0.801,
    npm: 0.199,
    revenueChange: 0.076,
    expenseChange: 0.029,
    profitChange: 0.317,
  },
  jun: {
    label: 'Juni 2026',
    revenue: 1_850_000_000,
    expenses: 1_455_807_450,
    profit: 394_192_550,
    cash: 231_600_000,
    turnover: 0.28,
    expenseRatio: 0.787,
    npm: 0.213,
    revenueChange: 0.402,
    expenseChange: 0.17,
    profitChange: 4.19,
  },
  ytd: {
    label: 'YTD 2026',
    revenue: 8_515_000_000,
    expenses: 7_158_807_450,
    profit: 1_356_192_550,
    cash: 312_650_000,
    turnover: 1.36,
    expenseRatio: 0.841,
    npm: 0.159,
    revenueChange: 0.076,
    expenseChange: 0.029,
    profitChange: 0.317,
  },
}

/** Tren bulanan dalam juta Rupiah. Bulan tanpa transaksi bernilai nol, bukan kosong. */
export const monthlyTrend = [
  { month: 'Jan', revenue: 0, expense: 0, profit: 0 },
  { month: 'Feb', revenue: 0, expense: 0, profit: 0 },
  { month: 'Mar', revenue: 0, expense: 0, profit: 0 },
  { month: 'Apr', revenue: 0, expense: 0, profit: 0 },
  { month: 'Mei', revenue: 1320, expense: 1244, profit: 76 },
  { month: 'Jun', revenue: 1850, expense: 1456, profit: 394 },
  { month: 'Jul', revenue: 1640, expense: 1425, profit: 215 },
  { month: 'Agu', revenue: 1785, expense: 1495, profit: 290 },
  { month: 'Sep', revenue: 1920, expense: 1538, profit: 382 },
  { month: 'Okt', revenue: 0, expense: 0, profit: 0 },
  { month: 'Nov', revenue: 0, expense: 0, profit: 0 },
  { month: 'Des', revenue: 0, expense: 0, profit: 0 },
]

export const dashboardRatios = [
  { name: 'Current Ratio', short: 'CR', value: '1,42', good: true },
  { name: 'Gross Profit Margin', short: 'GPM', value: '31,8%', good: true },
  { name: 'Net Profit Margin', short: 'NPM', value: '15,9%', good: false },
  { name: 'Debt to Equity', short: 'DER', value: '1,24', good: true },
  { name: 'Cashflow to Revenue', short: 'CFR', value: '37,2%', good: true },
]

export const cashFlowOverview = {
  opening: 205_000_000,
  incoming: 2_148_500_000,
  outgoing: 2_040_850_000,
  closing: 312_650_000,
}

export const payableRealization = {
  total: 820_000_000,
  paid: 565_800_000,
  outstanding: 254_200_000,
  percentage: 69,
}

export const receivableRealization = {
  total: 645_000_000,
  paid: 509_550_000,
  outstanding: 135_450_000,
  percentage: 79,
}

export const cashAccounts = [
  { name: 'Kas', type: 'Tunai', balance: 18_450_000 },
  { name: 'Petty Cash', type: 'Tunai', balance: 7_200_000 },
  { name: 'Bank BCA', type: 'Bank', balance: 182_750_000 },
  { name: 'Bank BNI', type: 'Bank', balance: 64_150_000 },
  { name: 'Bank BRI', type: 'Bank', balance: 31_600_000 },
  { name: 'Giro', type: 'Bank', balance: 8_500_000 },
]

export const totalCashBalance = cashAccounts.reduce((sum, account) => sum + account.balance, 0)
