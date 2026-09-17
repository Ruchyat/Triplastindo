import type { CustomerBalance, SupplierBalance } from '@/types'

export const customerBalances: CustomerBalance[] = [
  {
    code: 'CUS-001',
    name: 'PT Tali Nusantara',
    totalSales: 313_500_000,
    paid: 94_875_000,
    receivable: 218_625_000,
    deposit: 0,
    status: 'Aktif',
  },
  {
    code: 'CUS-002',
    name: 'CV Berkah Plastik',
    totalSales: 183_960_000,
    paid: 0,
    receivable: 183_960_000,
    deposit: 0,
    status: 'Aktif',
  },
  {
    code: 'CUS-003',
    name: 'UD Makmur Jaya',
    totalSales: 49_875_000,
    paid: 49_875_000,
    receivable: 0,
    deposit: 10_000_000,
    status: 'Aktif',
  },
  {
    code: 'CUS-004',
    name: 'PT Karya Mandiri',
    totalSales: 123_000_000,
    paid: 0,
    receivable: 123_000_000,
    deposit: 0,
    status: 'Aktif',
  },
]

export const customerSummary = {
  totalSalesYtd: 670_335_000,
  totalReceivable: 525_585_000,
  totalDeposit: 10_000_000,
  activeCustomers: '4 Customer',
}

export const supplierBalances: SupplierBalance[] = [
  {
    code: 'SUP-001',
    name: 'PT Sumber Plastik',
    totalPurchases: 642_500_000,
    paid: 187_500_000,
    payable: 455_000_000,
    openBills: '2 Tagihan',
  },
  {
    code: 'SUP-002',
    name: 'CV Teknik Makmur',
    totalPurchases: 118_750_000,
    paid: 118_750_000,
    payable: 0,
    openBills: 'Lunas',
  },
  {
    code: 'SUP-003',
    name: 'PT Kimia Sentosa',
    totalPurchases: 92_400_000,
    paid: 0,
    payable: 92_400_000,
    openBills: '1 Tagihan',
  },
  {
    code: 'SUP-004',
    name: 'Mitra Mesin Abadi',
    totalPurchases: 285_000_000,
    paid: 0,
    payable: 285_000_000,
    openBills: '1 Tagihan',
  },
]

export const supplierSummary = {
  totalPurchasesYtd: 1_138_650_000,
  totalPaid: 306_250_000,
  totalPayable: 832_400_000,
  openBills: '4 Tagihan',
}
