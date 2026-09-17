/**
 * Satu-satunya sumber definisi URL aplikasi.
 *
 * Sidebar, router, dan tautan antarhalaman memakai konstanta ini agar
 * perubahan route tidak perlu dicari manual di banyak berkas.
 */
export const routePaths = {
  dashboard: '/dashboard',

  // Transaksi bisnis
  sales: '/sales',
  purchases: '/purchases',
  expenses: '/expenses',
  cashBank: '/cash-bank',
  manualJournal: '/transactions/manual-journal',
  journals: '/journals',

  // Keuangan
  payables: '/payables',
  receivables: '/receivables',
  customerDeposits: '/customer-deposits',
  customers: '/customers',
  suppliers: '/suppliers',
  profitSharing: '/profit-sharing',

  // Laporan
  generalLedger: '/general-ledger',
  profitLoss: '/reports/profit-loss',
  balanceSheet: '/reports/balance-sheet',
  cashFlow: '/reports/cash-flow',

  // Operasional dan payroll
  inventorySummary: '/inventory-summary',
  assets: '/assets',
  payroll: '/payroll',
  payslips: '/payslips',

  // Sistem
  setup: '/setup',
} as const

export type RoutePath = (typeof routePaths)[keyof typeof routePaths]
