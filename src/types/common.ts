/** Warna semantik yang dipakai badge, kartu, dan indikator. */
export type Tone = 'blue' | 'green' | 'amber' | 'red' | 'slate'

/** Status pembayaran sebuah dokumen transaksi (invoice / tagihan / utang / piutang). */
export type PaymentStatus =
  | 'Draft'
  | 'Belum Bayar'
  | 'Sebagian'
  | 'Lunas'
  | 'Jatuh Tempo'
  | 'Dibatalkan'

/**
 * Metode penyelesaian transaksi. Penjualan memakai `Piutang`,
 * pembelian memakai `Utang` — keduanya memunculkan termin dan jatuh tempo.
 */
export type SettlementMethod = 'Cash' | 'Bank' | 'Piutang' | 'Utang'

/** Penanda apakah baris jurnal ikut dihitung pada Laporan Arus Kas. */
export type JournalTagging = 'Kas & Bank' | 'Non Kas & Bank'

/** Pilihan periode yang dipakai filter laporan dan dashboard. */
export type PeriodKey = 'jun' | 'sep' | 'ytd'

/** Nada badge untuk setiap status pembayaran. */
export const paymentStatusTone: Record<PaymentStatus, Tone> = {
  Draft: 'slate',
  'Belum Bayar': 'slate',
  Sebagian: 'amber',
  Lunas: 'green',
  'Jatuh Tempo': 'red',
  Dibatalkan: 'slate',
}
