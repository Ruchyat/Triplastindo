import type { JournalTagging, PaymentStatus } from './common'

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
