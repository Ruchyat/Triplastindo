import type { LedgerRow } from '@/types'

/*
 * Jurnal Umum sudah membaca database, sehingga mock-nya dihapus. Yang tersisa
 * di berkas ini hanya mock Buku Besar, yang halamannya belum tersambung.
 */

/** Mutasi Buku Besar untuk akun 1-10003 Bank BCA. */
export const ledgerRows: LedgerRow[] = [
  { date: '01 Sep', description: 'Saldo Awal', debit: 0, credit: 182_500_000, balance: 182_500_000 },
  { date: '03 Sep', description: 'Penjualan tali', debit: 125_000_000, credit: 0, balance: 307_500_000 },
  { date: '08 Sep', description: 'Pembelian bahan baku', debit: 0, credit: 72_500_000, balance: 235_000_000 },
  { date: '14 Sep', description: 'Pembayaran utang', debit: 0, credit: 45_000_000, balance: 190_000_000 },
  { date: '17 Sep', description: 'Penjualan tali', debit: 185_000_000, credit: 0, balance: 375_000_000 },
]

export const ledgerSummary = {
  account: '1-10003 · Bank BCA',
  normalBalance: 'Debit',
  openingBalance: 182_500_000,
  totalDebit: 310_000_000,
  totalCredit: 117_500_000,
  closingBalance: 375_000_000,
}
