/**
 * Satu-satunya sumber definisi URL aplikasi.
 *
 * Sidebar, router, dan tautan antarhalaman memakai konstanta ini agar
 * perubahan route tidak perlu dicari manual di banyak berkas.
 */
export const routePaths = {
  // Satu-satunya halaman publik.
  login: '/login',

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

/**
 * Halaman dokumen, yang alamatnya memuat identitas dokumennya.
 *
 * Dipisah dari `routePaths` karena bukan tujuan navigasi sidebar: keduanya
 * dicapai dari daftar atau dari tautan antardokumen, bukan dari menu.
 */
export const documentRoutes = {
  salesInvoiceNew: '/sales/invoices/new',
  salesInvoice: '/sales/invoices/:id',
  receiptNew: '/sales/receipts/new',
  receipt: '/sales/receipts/:id',
  depositNew: '/customer-deposits/new',
  depositCard: '/customer-deposits/:customerId',
  purchaseBillNew: '/purchases/bills/new',
  purchaseBill: '/purchases/bills/:id',
} as const

/**
 * Penyusun alamat dokumen.
 *
 * Dipakai setiap tautan antardokumen agar pola alamatnya hanya ditulis di
 * berkas ini — mengubah satu pola tidak perlu dicari manual ke seluruh fitur.
 */
export const toPath = {
  salesInvoiceNew: () => documentRoutes.salesInvoiceNew,
  salesInvoice: (id: number) => `/sales/invoices/${id}`,

  /** `customerId` dan `invoiceId` mengisi form pelunasan di muka. */
  receiptNew: (options: { customerId?: number; invoiceId?: number } = {}) => {
    const search = new URLSearchParams()
    if (options.customerId) search.set('customer', String(options.customerId))
    if (options.invoiceId) search.set('invoice', String(options.invoiceId))
    const query = search.toString()
    return query ? `${documentRoutes.receiptNew}?${query}` : documentRoutes.receiptNew
  },
  receipt: (id: number) => `/sales/receipts/${id}`,

  depositNew: (movement: 'received' | 'refunded', customerId?: number) => {
    const search = new URLSearchParams({ movement })
    if (customerId) search.set('customer', String(customerId))
    return `${documentRoutes.depositNew}?${search.toString()}`
  },
  depositCard: (customerId: number) => `/customer-deposits/${customerId}`,

  purchaseBillNew: () => documentRoutes.purchaseBillNew,
  purchaseBill: (id: number) => `/purchases/bills/${id}`,
}
