import type { DepositActivity, SalesInvoice } from '@/types'

export const salesInvoices: SalesInvoice[] = [
  {
    number: 'INV/2026/09/018',
    date: '17 Sep 2026',
    customer: 'PT Tali Nusantara',
    product: 'Tali',
    quantityKg: 8_500,
    pricePerKg: 10_500,
    total: 89_250_000,
    paid: 45_000_000,
    status: 'Sebagian',
  },
  {
    number: 'INV/2026/09/017',
    date: '15 Sep 2026',
    customer: 'CV Berkah Plastik',
    product: 'Biji Plastik',
    quantityKg: 6_200,
    pricePerKg: 8_300,
    total: 51_460_000,
    paid: 0,
    status: 'Belum Bayar',
  },
  {
    number: 'INV/2026/09/016',
    date: '12 Sep 2026',
    customer: 'UD Makmur Jaya',
    product: 'Tali',
    quantityKg: 4_750,
    pricePerKg: 10_500,
    total: 49_875_000,
    paid: 49_875_000,
    status: 'Lunas',
  },
  {
    number: 'INV/2026/09/015',
    date: '03 Sep 2026',
    customer: 'PT Karya Mandiri',
    product: 'Tali',
    quantityKg: 12_000,
    pricePerKg: 10_250,
    total: 123_000_000,
    paid: 0,
    status: 'Jatuh Tempo',
  },
]

export const salesSummary = {
  monthlySales: 313_585_000,
  received: 94_875_000,
  openReceivable: 218_710_000,
  overdueInvoices: '1 Invoice',
}

/**
 * Kartu deposit pelanggan.
 *
 * Deposit dicatat sebagai kewajiban ketika diterima, lalu dipotong otomatis
 * saat invoice dibuat. Karena itu satu customer tidak menyimpan saldo deposit
 * dan piutang terbuka secara bersamaan.
 */
export const depositActivities: DepositActivity[] = [
  {
    number: 'DEP/2026/09/009',
    date: '14 Sep 2026',
    customer: 'UD Makmur Jaya',
    description: 'Deposit Masuk',
    received: 25_000_000,
    applied: 0,
    balance: 25_000_000,
    source: 'Bank',
  },
  {
    number: 'DEP/2026/09/008',
    date: '10 Sep 2026',
    customer: 'UD Makmur Jaya',
    description: 'Digunakan pada INV/2026/09/012',
    received: 0,
    applied: 15_000_000,
    balance: 10_000_000,
    source: 'Invoice',
  },
  {
    number: 'DEP/2026/08/021',
    date: '29 Agu 2026',
    customer: 'UD Makmur Jaya',
    description: 'Deposit Masuk',
    received: 0,
    applied: 0,
    balance: 10_000_000,
    source: 'Saldo Awal',
  },
  {
    number: 'DEP/2026/08/018',
    date: '22 Agu 2026',
    customer: 'UD Makmur Jaya',
    description: 'Pengembalian Deposit',
    received: 0,
    applied: 15_000_000,
    balance: 10_000_000,
    source: 'Refund',
  },
]

/** Ringkasan deposit pada tab Deposit di halaman Penjualan. */
export const salesDepositSummary = {
  totalBalance: 127_500_000,
  receivedThisMonth: 147_500_000,
  appliedOrRefunded: 45_000_000,
}

/** Ringkasan deposit pada halaman Deposit Pelanggan. */
export const customerDepositSummary = {
  totalBalance: 10_000_000,
  receivedThisMonth: 25_000_000,
  appliedOrRefunded: 15_000_000,
}
