import type { JournalEntry, LedgerRow } from '@/types'

export const journalEntries: JournalEntry[] = [
  {
    number: 'JU/2026/09/0042',
    date: '17 Sep 2026',
    description: 'Penjualan tali tunai',
    accounts: 'Bank BCA / Penjualan Tali',
    debit: 185_000_000,
    credit: 185_000_000,
    tagging: 'Kas & Bank',
    createdBy: 'Andi Setiawan',
    paymentMethod: 'Transfer Sesama Bank',
    source: 'Transaksi Bisnis',
    attachment: 'bukti-transfer.pdf',
  },
  {
    number: 'JU/2026/09/0041',
    date: '16 Sep 2026',
    description: 'Pembelian karung polos',
    accounts: 'Persediaan / Bank BCA',
    debit: 72_500_000,
    credit: 72_500_000,
    tagging: 'Kas & Bank',
    createdBy: 'Andi Setiawan',
    paymentMethod: 'Transfer Antar Bank',
    source: 'Pembelian',
    attachment: 'tagihan-supplier.pdf',
  },
  {
    number: 'JU/2026/09/0040',
    date: '15 Sep 2026',
    description: 'Depresiasi aset September',
    accounts: 'Beban Penyusutan / Akumulasi',
    debit: 18_450_000,
    credit: 18_450_000,
    tagging: 'Non Kas & Bank',
    createdBy: 'Sistem',
    paymentMethod: '–',
    source: 'Jurnal Otomatis',
    attachment: '–',
  },
  {
    number: 'JU/2026/09/0039',
    date: '14 Sep 2026',
    description: 'Pembayaran utang HU-014',
    accounts: 'Hutang Usaha / Bank BCA',
    debit: 45_000_000,
    credit: 45_000_000,
    tagging: 'Kas & Bank',
    createdBy: 'Andi Setiawan',
    paymentMethod: 'Transfer Antar Bank',
    source: 'Kas & Bank',
    attachment: 'bukti-transfer.pdf',
  },
]

export const journalSummary = {
  totalDebit: 321_950_000,
  totalCredit: 321_950_000,
  /** Jumlah seluruh jurnal pada periode, dipakai untuk teks pagination. */
  totalEntries: 42,
}

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
