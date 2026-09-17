import type { ExpenseVoucher } from '@/types'

export const expenseVouchers: ExpenseVoucher[] = [
  {
    number: 'EXP/2026/09/041',
    date: '17 Sep 2026',
    category: 'Listrik Produksi',
    payee: 'PLN',
    amount: 64_500_000,
    paymentAccount: 'Bank BCA',
    status: 'Dibayar',
  },
  {
    number: 'EXP/2026/09/040',
    date: '16 Sep 2026',
    category: 'Transportasi Penjualan',
    payee: 'Logistik Jaya',
    amount: 12_750_000,
    paymentAccount: 'Bank BNI',
    status: 'Dibayar',
  },
  {
    number: 'EXP/2026/09/039',
    date: '14 Sep 2026',
    category: 'Maintenance Mesin',
    payee: 'Teknik Makmur',
    amount: 8_500_000,
    paymentAccount: 'Petty Cash',
    status: 'Dibayar',
  },
  {
    number: 'EXP/2026/09/038',
    date: '12 Sep 2026',
    category: 'Keamanan',
    payee: 'Polda',
    amount: 5_000_000,
    paymentAccount: 'Bank BCA',
    status: 'Dibayar',
  },
]

export const expenseSummary = {
  monthlyExpense: 90_750_000,
  productionExpense: 73_000_000,
  operationalExpense: 17_750_000,
}

/** Kategori biaya yang tersedia pada form pengeluaran. */
export const expenseCategories = [
  'Listrik Produksi',
  'Transportasi',
  'Maintenance',
  'Sewa',
  'Biaya Lainnya',
]
