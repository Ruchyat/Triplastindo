/**
 * Bentuk data yang datang dari API Laravel.
 *
 * Tipe di berkas lain menggambarkan data tampilan dan mock; tipe di sini
 * menggambarkan kontrak dengan backend apa adanya, termasuk penamaan
 * snake_case-nya. Keduanya sengaja dipisah agar perubahan pada API terlihat
 * jelas sebagai perubahan kontrak, bukan tersamar sebagai perubahan tampilan.
 *
 * Nilai uang selalu berupa **string** dua desimal. JSON.parse mengubah angka
 * menjadi double, dan nilai rupiah yang besar dapat kehilangan ketepatan di
 * sana; pakai `toAmount()` dari `@/lib` untuk mengubahnya saat akan ditampilkan.
 */

import type { Tone } from './common'

/** Pembungkus resource tunggal Laravel. */
export type Resource<T> = { data: T }

/** Pembungkus koleksi tanpa halaman. */
export type Collection<T> = { data: T[] }

/** Pembungkus koleksi berhalaman beserta metanya. */
export type Paginated<T> = {
  data: T[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number | null
    to: number | null
  }
}

// Chart of Accounts --------------------------------------------------------

export type ApiAccountCategory = {
  id: number
  name: string
  group: string
  group_label: string
  statement: 'neraca' | 'laba_rugi'
  statement_label: string
  is_cash: boolean
  sort_order: number
}

export type ApiAccount = {
  id: number
  code: string
  name: string
  /** `1-10003 · Bank BCA`, bentuk baku yang dipakai seluruh dropdown. */
  label: string
  account_category_id: number
  category?: ApiAccountCategory
  description: string | null
  normal_balance: 'debit' | 'kredit'
  normal_balance_label: string
  is_cash: boolean
  is_active: boolean
}

// Master data --------------------------------------------------------------

export type ApiCustomer = {
  id: number
  code: string
  name: string
  contact_name: string | null
  phone: string | null
  email: string | null
  address: string | null
  npwp: string | null
  payment_term_days: number
  credit_limit: string | null
  is_active: boolean
  open_receivable?: string
  deposit_balance?: string
  /** Hanya bila diminta dengan `with_activity`: penjualan dan pembayaran tahun itu. */
  total_sales?: string
  paid?: string
}

export type ApiProduct = {
  id: number
  code: string
  name: string
  category: string
  category_label: string
  unit: string
  revenue_account_id: number | null
  inventory_account_id: number | null
  revenue_account?: ApiAccount
  inventory_account?: ApiAccount
  is_active: boolean
}

export type ApiProductCategory = {
  value: string
  label: string
}

/** Produk baru atau suntingan; kode boleh kosong, dibuatkan backend. */
export type ProductPayload = {
  name: string
  category: string
  unit: string
  code?: string | null
  revenue_account_id?: number | null
  inventory_account_id?: number | null
  is_active?: boolean
}

export type CustomerPayload = {
  code?: string | null
  name: string
  contact_name?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  npwp?: string | null
  payment_term_days: number
  credit_limit?: string | null
  is_active?: boolean
}

export type SupplierPayload = Omit<CustomerPayload, 'credit_limit'>

export type AccountPayload = {
  code: string
  name: string
  account_category_id: number
  normal_balance: 'debit' | 'kredit'
  description?: string | null
  is_active?: boolean
}

// Jurnal -------------------------------------------------------------------

export type ApiJournalLine = {
  id: number
  account?: ApiAccount
  debit: string
  credit: string
  description: string | null
}

export type ApiJournalEntry = {
  id: number
  number: string
  date: string
  description: string
  tagging: 'kas_bank' | 'non_kas_bank'
  tagging_label: string
  source: string
  source_label: string
  source_id: number | null
  /** Nomor dokumen asal, `INV/2026/09/0001`. Kosong untuk jurnal manual. */
  source_number: string | null
  payment_method: string | null
  total_debit?: string
  total_credit?: string
  is_editable: boolean
  created_by?: { id: number; name: string }
  created_at: string | null
  lines?: ApiJournalLine[]
}

/** Ringkasan Jurnal Umum untuk filter yang sedang dipakai. */
export type ApiJournalSummary = {
  total_debit: string
  total_credit: string
  total_entries: number
  /**
   * Jumlah jurnal yang debit dan kreditnya tidak sama.
   *
   * Seharusnya selalu nol; angka selain nol berarti ada yang menulis ke tabel
   * jurnal tanpa melewati JournalPoster.
   */
  unbalanced_count: number
}

// Penjualan ----------------------------------------------------------------

/** Status dokumen sebagaimana disimpan dan ditampilkan backend. */
export type ApiDocumentStatus =
  | 'draft'
  | 'unpaid'
  | 'partial'
  | 'paid'
  | 'overdue'
  | 'cancelled'

/** Nada badge untuk setiap status dokumen yang datang dari API. */
export const documentStatusTone: Record<ApiDocumentStatus, Tone> = {
  draft: 'slate',
  unpaid: 'slate',
  partial: 'amber',
  paid: 'green',
  overdue: 'red',
  cancelled: 'slate',
}

/** Tunai berarti selesai sekarang; piutang berarti ditunda. */
export type ApiSettlementMethod = 'cash' | 'receivable'

export type ApiSalesInvoiceItem = {
  id: number
  product?: ApiProduct
  quantity: string
  unit_price: string
  amount: string
  description: string | null
}

export type ApiSalesInvoice = {
  id: number
  number: string
  date: string
  customer?: ApiCustomer
  settlement_method: ApiSettlementMethod
  settlement_method_label: string
  /** Saldo deposit customer dipakai memotong invoice ini. */
  use_deposit: boolean
  cash_account?: ApiAccount
  term_days: number | null
  due_date: string | null
  subtotal: string
  tax_amount: string
  total: string
  paid_amount: string
  outstanding_amount: string
  status: ApiDocumentStatus
  display_status: ApiDocumentStatus
  display_status_label: string
  is_posted: boolean
  journal_entry?: ApiJournalEntry
  note: string | null
  created_by?: { id: number; name: string }
  created_at: string | null
  items?: ApiSalesInvoiceItem[]
  /** Riwayat pelunasan invoice ini, satu baris per bukti penerimaan. */
  allocations?: ApiPaymentAllocation[]
  /** Deposit customer yang dipotong saat invoice ini diposting. */
  deposit_applications?: ApiCustomerDeposit[]
}

// Pengeluaran --------------------------------------------------------------

export type ApiExpense = {
  id: number
  number: string
  date: string
  expense_account?: ApiAccount
  cash_account?: ApiAccount
  payee: string | null
  description: string
  amount: string
  reference: string | null
  note: string | null
  status: ApiReceiptStatus
  status_label: string
  journal_entry?: ApiJournalEntry
  created_by?: { id: number; name: string }
  created_at: string | null
}

export type ApiExpenseSummary = {
  total: string
  production: string
  operational: string
  count: number
}

export type ExpensePayload = {
  date: string
  expense_account_id: number
  cash_account_id: number
  payee?: string | null
  description: string
  amount: string
  reference?: string | null
  note?: string | null
}

// Kas & Bank ---------------------------------------------------------------

export type ApiCashTransfer = {
  id: number
  number: string
  date: string
  from_account?: ApiAccount
  to_account?: ApiAccount
  amount: string
  reference: string | null
  note: string | null
  status: ApiReceiptStatus
  status_label: string
  journal_entry?: ApiJournalEntry
  created_by?: { id: number; name: string }
  created_at: string | null
}

export type CashTransferPayload = {
  date: string
  from_account_id: number
  to_account_id: number
  amount: string
  reference?: string | null
  note?: string | null
}

/** Akun kas/bank beserta saldonya per tanggal tertentu. */
export type ApiCashAccountBalance = ApiAccount & { balance: string }

/** Satu baris jurnal yang menyentuh akun kas/bank. */
export type ApiCashMutation = {
  id: number
  date: string
  account: ApiAccount
  journal_entry_id: number
  journal_number: string | null
  source: string | null
  source_label: string | null
  source_number: string | null
  description: string | null
  debit: string
  credit: string
}

// Laporan keuangan ---------------------------------------------------------

export type ApiReportRow = {
  account_id: number
  code: string
  name: string
  category?: string
  amount: string
}

export type ApiReportSection = {
  key: string
  title: string
  side?: 'assets' | 'liabilities' | 'equity'
  rows: ApiReportRow[]
  total: string
}

export type ApiProfitLoss = {
  from: string | null
  to: string
  sections: ApiReportSection[]
  results: {
    revenue: string
    gross_profit: string
    operating_profit: string
    other_income_expense: string
    profit_before_tax: string
    tax: string
    net_profit: string
    total_expenses: string
  }
}

export type ApiFinancialRatio = {
  key: string
  name: string
  value: number | null
  standard: number | null
  direction: 'min' | 'max'
  format: 'number' | 'percent'
  verdict: 'good' | 'bad' | 'info'
  hint: string
}

export type ApiBalanceSheet = {
  as_of: string
  sections: ApiReportSection[]
  earnings: { retained_prior: string; current_year: string }
  totals: {
    current_assets: string
    fixed_assets: string
    accumulated_depreciation: string
    total_assets: string
    liabilities: string
    current_liabilities: string
    equity: string
    total_liabilities_equity: string
    difference: string
    inventory: string
    cash: string
  }
  ratios: ApiFinancialRatio[]
}

export type ApiCashFlowActivity = {
  key: string
  title: string
  rows: { key: string; label: string; amount: string }[]
  total: string
}

export type ApiCashFlow = {
  from: string
  to: string
  activities: ApiCashFlowActivity[]
  summary: {
    opening_balance: string
    net_operating: string
    net_investing: string
    net_financing: string
    net_change: string
    closing_balance: string
    ledger_cash: string
  }
}

export type ApiDashboardKpi = {
  revenue: string
  expenses: string
  net_profit: string
  asset_turnover: number | null
  expense_ratio: number | null
  net_profit_margin: number | null
  revenue_change: number | null
  expense_change: number | null
  profit_change: number | null
}

export type ApiDashboard = {
  year: number
  month: number
  as_of: string
  period: ApiDashboardKpi
  ytd: ApiDashboardKpi
  ratios: ApiFinancialRatio[]
  cash: {
    as_of: string
    total: string
    accounts: { id: number; code: string; name: string; balance: string }[]
  }
  cash_flow_ytd: { opening: string; incoming: string; outgoing: string; closing: string }
  monthly: { month: number; revenue: string; expenses: string; net_profit: string }[]
  payables: ApiRealization
  receivables: ApiRealization
}

export type ApiRealization = {
  total: string
  paid: string
  outstanding: string
  percentage: number | null
}

// Pengaturan, periode, pengguna ----------------------------------------------

export type ApiSettings = {
  company: { name: string; address: string; website: string; email: string; phone: string; npwp: string }
  parameters: { minimum_cash: string; dividend_tax_rate: number; residual_value_rate: number; fiscal_year: number }
  ratio_standards: Record<string, number>
  payment_methods: string[]
}

export type ApiFiscalPeriod = {
  year: number
  month: number
  status: 'open' | 'closed'
  journal_count: number
  closed_by: string | null
  closed_at: string | null
}

export type ApiUser = {
  id: number
  name: string
  email: string
  role: 'super_admin' | 'finance' | 'hr' | 'direksi' | 'viewer'
  role_label: string
  is_active: boolean
}

export type UserPayload = {
  name: string
  email: string
  password?: string | null
  role: ApiUser['role']
  is_active?: boolean
}

export type OpeningBalancePayload = {
  date: string
  rows: { account_code: string; amount: string }[]
}

// Aset tetap -----------------------------------------------------------------

export type ApiAssetType = {
  id: number
  name: string
  default_useful_life_years: number
  is_depreciable: boolean
  asset_account: string | null
  accumulated_account: string | null
  expense_account: string | null
  asset_account_id: number
  accumulated_account_id: number | null
  expense_account_id: number | null
  assets_count: number
}

export type ApiFixedAsset = {
  id: number
  code: string
  name: string
  asset_type_id: number
  type?: { id: number; name: string; is_depreciable: boolean }
  acquisition_date: string
  in_use_date: string
  cost: string
  residual_value: string
  useful_life_months: number
  useful_life_years: number
  yearly_depreciation: string
  monthly_depreciation: string
  months_in_use: number
  opening_accumulated: string
  accumulated_depreciation: string
  book_value: string
  status: 'active' | 'disposed'
  disposed_at: string | null
  note: string | null
  depreciations?: { year: number; month: number; amount: string; journal_entry_id: number | null }[]
}

export type FixedAssetPayload = {
  code: string
  name: string
  asset_type_id: number
  acquisition_date: string
  in_use_date?: string | null
  cost: string
  residual_value?: string | null
  useful_life_years?: number | null
  opening_accumulated?: string | null
  funding?: 'opening' | 'cash' | 'payable'
  cash_account_id?: number | null
  note?: string | null
}

export type ApiDepreciationSchedule = {
  year: number
  months: { month: number; posted: boolean; total: string; assets: number }[]
  by_type: { type: string; monthly_expected: string; yearly_expected: string; months: string[] }[]
}

// Karyawan & payroll ---------------------------------------------------------

export type ApiEmployee = {
  id: number
  nik: string
  name: string
  department: 'produksi' | 'kantor' | 'lapangan'
  department_label: string
  position: string | null
  employment_status: 'tetap' | 'kontrak' | 'harian'
  employment_status_label: string
  joined_at: string | null
  basic_salary: string
  allowance: string
  expense_account_id: number
  expense_account: string | null
  bank_account: string | null
  is_active: boolean
  loan_balance: string | null
}

export type EmployeePayload = {
  nik: string
  name: string
  department: ApiEmployee['department']
  position?: string | null
  employment_status: ApiEmployee['employment_status']
  joined_at?: string | null
  basic_salary: string
  allowance?: string | null
  expense_account_id?: number | null
  bank_account?: string | null
  is_active?: boolean
}

export const PAYROLL_AMOUNT_FIELDS = [
  'basic_salary', 'overtime', 'allowance', 'bonus', 'loan_advance',
  'tax_pph21', 'bpjs_employment', 'bpjs_health', 'loan_deduction',
] as const

export type PayrollAmountField = (typeof PAYROLL_AMOUNT_FIELDS)[number]

export type ApiPayrollItem = Record<PayrollAmountField, string> & {
  id: number
  employee_id: number
  employee: {
    id: number
    nik: string
    name: string
    department: string
    department_label: string
    position: string | null
    employment_status: string
  } | null
  gross: string
  net: string
  take_home: string
}

export type ApiPayrollRun = {
  id: number
  number: string
  year: number
  month: number
  payment_date: string
  cash_account?: ApiAccount
  status: 'draft' | 'posted' | 'cancelled'
  total_gross: string
  total_net: string
  total_take_home: string
  note: string | null
  journal_entry?: ApiJournalEntry
  created_by?: { id: number; name: string }
  items_count?: number
  items?: ApiPayrollItem[]
}

export type ApiPayrollSummary = {
  year: number
  employees: {
    employee_id: number
    name: string
    department_label: string
    months: number
    gross: string
    net: string
    take_home: string
    loan_advance: string
    loan_deduction: string
    loan_balance: string
  }[]
}

// Bagi hasil -----------------------------------------------------------------

export type ApiShareholder = {
  id: number
  name: string
  shares: number
  percentage: number
  user_id: number | null
  user_name: string | null
  is_active: boolean
}

export type ApiDividendCheckpoint = {
  year: number
  month: number
  quarter: string
  cash_balance: string
  minimum_cash: string
  is_safe: boolean
  net_profit: string
  net_profit_ytd: string
  decision_id: number | null
  decision_status: 'draft' | 'approved' | 'cancelled' | null
  decision_date: string | null
  distributed: string
  retained: string
  payout_ratio: number | null
}

export type ApiDividendDecision = {
  id: number
  number: string
  year: number
  month: number
  decision_date: string
  total_amount: string
  tax_rate: number
  cash_account?: ApiAccount
  status: 'draft' | 'approved' | 'cancelled'
  cash_balance: string
  minimum_cash: string
  is_safe: boolean
  net_profit: string
  note: string | null
  journal_entry?: ApiJournalEntry
  proposed_by?: { id: number; name: string }
  approved_by?: { id: number; name: string }
  approved_at: string | null
  allocations?: {
    id: number
    shareholder_id: number
    shareholder: string | null
    shares: number
    percentage: number
    gross: string
    tax: string
    net: string
  }[]
}

export type DividendPayload = {
  year: number
  month: number
  decision_date: string
  total_amount: string
  tax_rate?: number | null
  cash_account_id: number
  note?: string | null
}

// Inventory --------------------------------------------------------------------

export type ApiInventoryMonth = {
  month: number
  qty_in: string
  qty_out: string
  qty_balance: string
  inventory_value: string
  sold_qty: string
  sales_amount: string
  cost_of_sold: string
}

export type ApiInventoryProduct = {
  product_id: number
  code: string
  name: string
  category: string
  category_label: string
  unit: string
  inventory_account: string | null
  opening_qty: string
  average_cost: string
  months: ApiInventoryMonth[]
  totals: { qty_in: string; qty_out: string; qty_balance: string; inventory_value: string; sold_qty: string; sales_amount: string }
}

export type ApiHppPerKg = {
  produced_kg: string
  sold_kg: string
  purchased_kg: string
  purchased_amount: string
  average_purchase_per_kg: string | null
  material_per_kg: string | null
  hpp_per_kg: string | null
  operational_per_kg: string | null
  selling_price_per_kg: string | null
  margin_per_kg: string | null
  hpp_ratio: number | null
}

export type ApiInventorySummary = { year: number; products: ApiInventoryProduct[]; hpp_per_kg: ApiHppPerKg }

export type ApiStockMovement = {
  id: number
  date: string
  product: { id: number; code: string; name: string; unit: string }
  type: string
  type_label: string
  direction: 'in' | 'out'
  quantity: string
  unit_cost: string
  amount: string
  source_number: string | null
  journal_number: string | null
  description: string | null
}

export type StockMovementPayload = {
  date: string
  product_id: number
  type: 'consumption' | 'production_in' | 'adjustment' | 'opening'
  direction?: 'in' | 'out'
  quantity: string
  unit_cost?: string | null
  description?: string | null
}

// Buku Besar & Neraca Saldo ------------------------------------------------

/** Satu akun pada neraca saldo. Saldo mengikuti saldo normal akunnya. */
export type ApiTrialBalanceRow = {
  account: ApiAccount
  opening_balance: string
  debit: string
  credit: string
  closing_balance: string
}

export type ApiLedgerLine = {
  id: number
  date: string
  journal_entry_id: number
  journal_number: string | null
  source_label: string | null
  source_number: string | null
  description: string | null
  debit: string
  credit: string
  balance: string
}

export type ApiAccountLedger = {
  account: ApiAccount
  opening_balance: string
  total_debit: string
  total_credit: string
  closing_balance: string
  lines: ApiLedgerLine[]
}

/** Isi permintaan jurnal manual. Nominal dikirim sebagai string, seperti dokumen lain. */
export type JournalEntryPayload = {
  date: string
  description: string
  payment_method?: string | null
  lines: {
    account_code: string
    debit?: string | null
    credit?: string | null
    description?: string | null
  }[]
}

// Penerimaan pembayaran ----------------------------------------------------

export type ApiReceiptStatus = 'posted' | 'cancelled'

/** Bagian sebuah penerimaan yang dipakai melunasi satu invoice. */
export type ApiPaymentAllocation = {
  id: number
  amount: string
  invoice?: ApiSalesInvoice
  receipt?: ApiPaymentReceipt
}

export type ApiPaymentReceipt = {
  id: number
  number: string
  date: string
  customer?: ApiCustomer
  cash_account?: ApiAccount
  amount: string
  reference: string | null
  note: string | null
  status: ApiReceiptStatus
  status_label: string
  journal_entry?: ApiJournalEntry
  created_by?: { id: number; name: string }
  created_at: string | null
  allocations?: ApiPaymentAllocation[]
}

/** Isi permintaan pencatatan penerimaan pembayaran. */
export type PaymentReceiptPayload = {
  date: string
  customer_id: number
  cash_account_id: number
  reference?: string | null
  note?: string | null
  allocations: { sales_invoice_id: number; amount: string }[]
}

// Pembayaran supplier ------------------------------------------------------

/** Bagian sebuah pembayaran yang dipakai melunasi satu tagihan pembelian. */
export type ApiSupplierPaymentAllocation = {
  id: number
  amount: string
  bill?: ApiPurchaseBill
  payment?: ApiSupplierPayment
}

export type ApiSupplierPayment = {
  id: number
  number: string
  date: string
  supplier?: ApiSupplier
  cash_account?: ApiAccount
  amount: string
  reference: string | null
  note: string | null
  status: ApiReceiptStatus
  status_label: string
  journal_entry?: ApiJournalEntry
  created_by?: { id: number; name: string }
  created_at: string | null
  allocations?: ApiSupplierPaymentAllocation[]
}

/** Isi permintaan pencatatan pembayaran supplier. */
export type SupplierPaymentPayload = {
  date: string
  supplier_id: number
  cash_account_id: number
  reference?: string | null
  note?: string | null
  allocations: { purchase_bill_id: number; amount: string }[]
}

// Pembelian ----------------------------------------------------------------

export type ApiSupplier = {
  id: number
  code: string
  name: string
  contact_name: string | null
  phone: string | null
  email: string | null
  address: string | null
  npwp: string | null
  payment_term_days: number
  is_active: boolean
  open_payable?: string
  /** Hanya bila diminta dengan `with_activity`: pembelian dan pembayaran tahun itu. */
  total_purchases?: string
  paid?: string
}

/**
 * Kategori pembelian beserta akun yang dipakainya.
 *
 * Dikirim backend, bukan didaftar ulang di frontend: pemetaannya ada di
 * konfigurasi server dan dapat berubah tanpa menyentuh aplikasi ini.
 */
export type ApiPurchaseCategory = {
  value: string
  label: string
  hint: string
  /** Masuk persediaan, sehingga tiap baris harus menunjuk produk. */
  is_stock: boolean
  /** Akun bebannya dipilih pengguna, bukan ditentukan kategori. */
  needs_account_choice: boolean
  debit_account: string | null
  payable_account: string | null
}

export type ApiPurchaseBillItem = {
  id: number
  product?: ApiProduct
  description: string | null
  /** Nama produk bila ada, selain itu keterangannya. */
  label: string
  quantity: string
  unit: string
  unit_price: string
  amount: string
}

export type ApiPurchaseSettlement = 'cash' | 'payable'

export type ApiPurchaseBill = {
  id: number
  number: string
  date: string
  supplier?: ApiSupplier
  supplier_invoice_number: string | null

  category: string
  category_label: string
  is_stock_category: boolean
  debit_account_code: string | null
  expense_account?: ApiAccount

  settlement_method: ApiPurchaseSettlement
  settlement_method_label: string
  cash_account?: ApiAccount
  term_days: number | null
  due_date: string | null

  subtotal: string
  tax_amount: string
  total: string
  paid_amount: string
  outstanding_amount: string

  status: ApiDocumentStatus
  display_status: ApiDocumentStatus
  display_status_label: string

  is_posted: boolean
  journal_entry?: ApiJournalEntry
  note: string | null
  created_by?: { id: number; name: string }
  created_at: string | null
  items?: ApiPurchaseBillItem[]
}

export type ApiPurchaseSummary = {
  total_purchases: string
  paid: string
  open_payable: string
  overdue_count: number
}

/** Isi permintaan pembuatan tagihan pembelian. */
export type PurchaseBillPayload = {
  date: string
  supplier_id: number
  supplier_invoice_number?: string | null
  category: string
  expense_account_id?: number | null
  settlement_method: ApiPurchaseSettlement
  cash_account_id?: number | null
  term_days?: number | null
  due_date?: string | null
  tax_amount?: string
  down_payment?: string
  note?: string | null
  items: {
    product_id?: number | null
    description?: string | null
    quantity: string
    unit?: string
    unit_price: string
  }[]
  post?: boolean
}

// Deposit pelanggan --------------------------------------------------------

export type ApiDepositMovement = 'received' | 'applied' | 'refunded'

/** Satu mutasi pada kartu deposit pelanggan. */
export type ApiCustomerDeposit = {
  id: number
  number: string
  date: string
  customer?: ApiCustomer
  movement: ApiDepositMovement
  movement_label: string
  amount: string
  /** Nilai mutasi yang menambah saldo; `0.00` bila mengurangi. */
  received: string
  /** Nilai mutasi yang mengurangi saldo; `0.00` bila menambah. */
  applied_or_refunded: string
  cash_account?: ApiAccount
  invoice?: ApiSalesInvoice
  reference: string | null
  note: string | null
  status: ApiReceiptStatus
  status_label: string
  journal_entry?: ApiJournalEntry
  created_by?: { id: number; name: string }
  created_at: string | null
}

/**
 * Posisi deposit seorang customer.
 *
 * Keempat angkanya lengkap agar barisnya dapat dijumlah sendiri oleh pembaca:
 * masuk − terpakai − dikembalikan = saldo.
 */
export type ApiDepositBalance = {
  customer: { id: number; code: string; name: string }
  received: string
  applied: string
  refunded: string
  balance: string
  last_activity: string | null
}

export type ApiDepositSummary = {
  total_balance: string
  received: string
  applied_or_refunded: string
}

/** Isi permintaan pencatatan mutasi deposit. */
export type CustomerDepositPayload = {
  date: string
  customer_id: number
  movement: 'received' | 'refunded'
  amount: string
  cash_account_id: number
  reference?: string | null
  note?: string | null
}

/** Ringkasan penjualan untuk kartu statistik, dihitung backend. */
export type ApiSalesSummary = {
  total_sales: string
  received: string
  open_receivable: string
  overdue_count: number
}

/** Isi permintaan pembuatan invoice penjualan. */
export type SalesInvoicePayload = {
  date: string
  customer_id: number
  settlement_method: ApiSettlementMethod
  cash_account_id?: number | null
  term_days?: number | null
  due_date?: string | null
  tax_amount?: string
  down_payment?: string
  use_deposit?: boolean
  note?: string | null
  items: {
    product_id: number
    quantity: string
    unit_price: string
    description?: string | null
  }[]
  /** `false` menyimpan sebagai draft tanpa membentuk jurnal. */
  post?: boolean
}
