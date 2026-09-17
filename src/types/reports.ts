/** Satu baris akun di dalam laporan keuangan. */
export type ReportLine = {
  label: string
  amount: number
}

/** Satu kelompok akun pada Laporan Laba Rugi, lengkap dengan barisnya. */
export type ProfitLossSection = {
  title: string
  rows: ReportLine[]
  total: ReportLine
}

/** Satu kelompok akun pada Laporan Neraca. */
export type BalanceSheetSection = {
  title: string
  rows: ReportLine[]
}

/** Peran sebuah baris di Laporan Arus Kas menentukan gaya tampilannya. */
export type CashFlowRowKind = 'section' | 'item' | 'total'

/** Satu baris pada Laporan Arus Kas. */
export type CashFlowRow = {
  kind: CashFlowRowKind
  label: string
  amount: number
}

/** Hasil evaluasi satu rasio keuangan terhadap standar perusahaan. */
export type FinancialRatio = {
  name: string
  value: string
  standard: string
  /** `info` dipakai untuk rasio tanpa standar, misalnya Asset Turnover. */
  verdict: 'good' | 'bad' | 'info'
}
