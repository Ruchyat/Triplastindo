import type { JournalTagging, PaymentStatus } from './common'

/** Jenis dokumen transaksi yang dapat dibuat lewat `TransactionDrawer`. */
export type DocumentType =
  | 'sale'
  | 'purchase'
  | 'expense'
  | 'receipt'
  | 'payment'
  | 'transfer'
  | 'deposit'
  | 'refund'

/** Tagihan pembelian — sumber persediaan/beban/aset dan utang. */
export type PurchaseBill = {
  number: string
  date: string
  supplier: string
  category: string
  item: string
  total: number
  paid: number
  status: PaymentStatus
}

/** Bukti pengeluaran biaya yang dibayar langsung. */
export type ExpenseVoucher = {
  number: string
  date: string
  category: string
  payee: string
  amount: number
  paymentAccount: string
  status: string
}

/** Satu baris mutasi pada akun kas atau bank. */
export type CashBankMovement = {
  date: string
  account: string
  type: 'Penerimaan' | 'Pengeluaran' | 'Transfer'
  counterparty: string
  reference: string
  /** Positif berarti uang masuk, negatif berarti uang keluar. */
  amount: number
}

/** Satu transaksi pada Jurnal Umum (tampilan gabungan per dokumen). */
export type JournalEntry = {
  number: string
  date: string
  description: string
  accounts: string
  debit: number
  credit: number
  tagging: JournalTagging
  createdBy: string
  paymentMethod: string
  source: string
  attachment: string
}

/** Satu baris mutasi pada Buku Besar dengan saldo berjalan. */
export type LedgerRow = {
  date: string
  description: string
  debit: number
  credit: number
  balance: number
}
