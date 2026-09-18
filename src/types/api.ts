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
  category?: ApiAccountCategory
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
  payment_term_days: number
  credit_limit: string | null
  is_active: boolean
  open_receivable?: string
  deposit_balance?: string
}

export type ApiProduct = {
  id: number
  code: string
  name: string
  category: string
  category_label: string
  unit: string
  revenue_account?: ApiAccount
  is_active: boolean
}

export type ApiProductCategory = {
  value: string
  label: string
}

/** Produk baru; kode boleh kosong, dibuatkan backend. */
export type ProductPayload = {
  name: string
  category: string
  unit: string
  code?: string | null
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
  payment_term_days: number
  is_active: boolean
  open_payable?: string
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
