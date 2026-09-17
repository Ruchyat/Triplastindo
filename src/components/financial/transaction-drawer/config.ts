import type { DocumentType } from '@/types'

/** Judul panel untuk setiap jenis dokumen transaksi. */
export const documentTitles: Record<DocumentType, string> = {
  sale: 'Invoice Penjualan',
  purchase: 'Tagihan Pembelian',
  expense: 'Pengeluaran',
  receipt: 'Penerimaan Pembayaran',
  payment: 'Pembayaran',
  transfer: 'Transfer Antar Akun',
  deposit: 'Terima Deposit Pelanggan',
  refund: 'Kembalikan Deposit Pelanggan',
}

/**
 * Nilai contoh yang dipakai preview jurnal selama tahap UI.
 * Angka sebenarnya akan datang dari baris item dokumen.
 */
export const sampleInvoiceTotal = 100_000_000

/** Saldo deposit contoh milik customer terpilih. */
export const sampleCustomerDeposit = 10_000_000
