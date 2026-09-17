import type {
  BalanceSheetSection,
  CashFlowRow,
  FinancialRatio,
  ProfitLossSection,
} from '@/types'

/** Total pendapatan periode, dipakai sebagai pembagi kolom `% Revenue`. */
export const totalRevenue = 1_837_500_000

export const profitLossSections: ProfitLossSection[] = [
  {
    title: 'PENDAPATAN',
    rows: [
      { label: 'Penjualan Tali', amount: 1_485_000_000 },
      { label: 'Penjualan Biji Plastik', amount: 365_000_000 },
      { label: 'Retur & Potongan Penjualan', amount: -12_500_000 },
    ],
    total: { label: 'TOTAL PENDAPATAN', amount: 1_837_500_000 },
  },
  {
    title: 'HPP PRODUKSI',
    rows: [
      { label: 'Pemakaian Bahan Baku', amount: 710_000_000 },
      { label: 'Gaji & Lembur Produksi', amount: 224_500_000 },
      { label: 'Overhead Produksi', amount: 318_750_000 },
    ],
    total: { label: 'TOTAL HPP PRODUKSI', amount: 1_253_250_000 },
  },
  {
    title: 'BEBAN OPERASIONAL',
    rows: [
      { label: 'Gaji Direksi & Staff', amount: 98_500_000 },
      { label: 'Administrasi & Umum', amount: 42_750_000 },
      { label: 'Penjualan & Transportasi', amount: 38_400_000 },
    ],
    total: { label: 'TOTAL BEBAN OPERASIONAL', amount: 179_650_000 },
  },
]

/** Baris hasil perhitungan di bawah kelompok akun Laba Rugi. */
export const profitLossResults = {
  grossProfit: 584_250_000,
  operatingProfit: 404_600_000,
  otherIncomeExpense: -12_600_000,
  netProfit: 382_000_000,
}

/** Angka produksi yang menjadi dasar perhitungan HPP per Kg. */
export const productionStats = {
  materialPurchaseKg: '152.400',
  materialPurchaseAmount: 'Rp 710.000.000',
  pelletProductionKg: '86.750',
  ropeProductionKg: '61.200',
  sellingPricePerKg: 'Rp 8.300',
}

export const hppPerKg = {
  averagePurchasePerKg: 'Rp 4.659',
  componentPerKg: 'Rp 6.831',
  operationalPerKg: 'Rp 903',
  totalPerKg: 'Rp 7.734',
  ratioLabel: '93,2%',
  ratioValue: 93,
  marginLabel: 'Margin Rp 566/kg',
}

export const balanceSheetSections: BalanceSheetSection[] = [
  {
    title: 'ASET LANCAR',
    rows: [
      { label: 'Kas & Bank', amount: 312_650_000 },
      { label: 'Piutang Usaha', amount: 135_450_000 },
      { label: 'Persediaan', amount: 684_800_000 },
      { label: 'Aktiva Lancar Lainnya', amount: 98_500_000 },
    ],
  },
  {
    title: 'ASET TETAP',
    rows: [
      { label: 'Harga Perolehan', amount: 2_845_000_000 },
      { label: 'Akumulasi Penyusutan', amount: -418_500_000 },
    ],
  },
  {
    title: 'LIABILITAS',
    rows: [
      { label: 'Kewajiban Lancar', amount: 454_200_000 },
      { label: 'Kewajiban Jangka Panjang', amount: 780_000_000 },
    ],
  },
  {
    title: 'EKUITAS',
    rows: [
      { label: 'Modal Disetor', amount: 1_600_000_000 },
      { label: 'Laba Ditahan', amount: 442_507_450 },
      { label: 'Pendapatan Periode Ini', amount: 382_000_000 },
    ],
  },
]

export const balanceSheetSummary = {
  totalAssets: 3_657_900_000,
  totalLiabilitiesAndEquity: 3_657_900_000,
  /** Nol berarti neraca balance. Nilai lain harus ditampilkan sebagai selisih. */
  difference: 0,
}

export const financialRatios: FinancialRatio[] = [
  { name: 'Current Ratio', value: '1,42', standard: '≥ 1,20', verdict: 'good' },
  { name: 'Quick Ratio', value: '0,63', standard: '≥ 1,20', verdict: 'bad' },
  { name: 'Gross Profit Margin', value: '31,8%', standard: '≥ 30%', verdict: 'good' },
  { name: 'Net Profit Margin', value: '20,8%', standard: '≥ 20%', verdict: 'good' },
  { name: 'Debt to Equity', value: '0,51', standard: '≤ 1,80', verdict: 'good' },
  { name: 'Cashflow to Revenue', value: '37,2%', standard: '≥ 35%', verdict: 'good' },
  { name: 'Asset Turnover', value: '1,36', standard: '–', verdict: 'info' },
]

export const cashFlowRows: CashFlowRow[] = [
  { kind: 'section', label: 'A. AKTIVITAS OPERASI', amount: 0 },
  { kind: 'item', label: 'Penerimaan Kas dari Pelanggan', amount: 2_148_500_000 },
  { kind: 'item', label: 'Pembayaran atas Beban Usaha', amount: -1_776_800_000 },
  { kind: 'total', label: 'ARUS KAS BERSIH OPERASI', amount: 371_700_000 },
  { kind: 'section', label: 'B. AKTIVITAS INVESTASI', amount: 0 },
  { kind: 'item', label: 'Pembelian Aset Tetap', amount: -84_000_000 },
  { kind: 'item', label: 'Penjualan Aset Tetap', amount: 0 },
  { kind: 'total', label: 'ARUS KAS BERSIH INVESTASI', amount: -84_000_000 },
  { kind: 'section', label: 'C. AKTIVITAS PENDANAAN', amount: 0 },
  { kind: 'item', label: 'Penerimaan Pinjaman', amount: 120_000_000 },
  { kind: 'item', label: 'Pembayaran Pinjaman', amount: -200_050_000 },
  { kind: 'item', label: 'Dividen', amount: -100_000_000 },
  { kind: 'total', label: 'ARUS KAS BERSIH PENDANAAN', amount: -180_050_000 },
]

export const cashFlowSummary = {
  netOperating: 371_700_000,
  netChange: 107_650_000,
  openingBalance: 205_000_000,
  closingBalance: 312_650_000,
  /** Saldo kas menurut Neraca; harus sama dengan `closingBalance`. */
  balanceSheetCash: 312_650_000,
  difference: 0,
}
