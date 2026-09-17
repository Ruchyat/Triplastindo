import type {
  Account,
  AssetTypeMaster,
  CustomerMaster,
  EmployeeMaster,
  FiscalPeriod,
  ProductMaster,
  ShareholderMaster,
  SupplierMaster,
} from '@/types'

export const chartOfAccounts: Account[] = [
  { code: '1-10001', name: 'Kas', category: 'Kas & Bank', normalBalance: 'Debit', active: true },
  { code: '1-10003', name: 'Bank BCA', category: 'Kas & Bank', normalBalance: 'Debit', active: true },
  { code: '1-10100', name: 'Piutang Usaha', category: 'Piutang Usaha', normalBalance: 'Debit', active: true },
  { code: '1-10202', name: 'Persediaan WIP', category: 'Persediaan', normalBalance: 'Debit', active: true },
  { code: '2-10000', name: 'Hutang Usaha', category: 'Kewajiban Lancar', normalBalance: 'Kredit', active: true },
  { code: '3-10000', name: 'Modal Disetor', category: 'Ekuitas', normalBalance: 'Kredit', active: true },
  { code: '4-10000', name: 'Penjualan Tali', category: 'Pendapatan', normalBalance: 'Kredit', active: true },
  {
    code: '5-10000',
    name: 'Pemakaian Bahan Baku Polos',
    category: 'HPP Produksi',
    normalBalance: 'Debit',
    active: true,
  },
]

export const customerMasters: CustomerMaster[] = [
  { code: 'CUS-001', name: 'PT Tali Nusantara', contact: 'Budi · 0812-xxxx', term: '30 Hari', creditLimit: 'Rp 500.000.000' },
  { code: 'CUS-002', name: 'CV Berkah Plastik', contact: 'Rudi · 0813-xxxx', term: '30 Hari', creditLimit: 'Rp 250.000.000' },
  { code: 'CUS-003', name: 'UD Makmur Jaya', contact: 'Sari · 0817-xxxx', term: '14 Hari', creditLimit: 'Rp 150.000.000' },
  { code: 'CUS-004', name: 'PT Karya Mandiri', contact: 'Doni · 0818-xxxx', term: '30 Hari', creditLimit: 'Rp 400.000.000' },
]

export const supplierMasters: SupplierMaster[] = [
  { code: 'SUP-001', name: 'PT Sumber Plastik', category: 'Bahan Baku', contact: 'Andi · 0812-xxxx', term: '30 Hari' },
  { code: 'SUP-002', name: 'CV Teknik Makmur', category: 'Sparepart', contact: 'Tono · 0813-xxxx', term: '14 Hari' },
  { code: 'SUP-003', name: 'PT Kimia Sentosa', category: 'Bahan Pendukung', contact: 'Nina · 0817-xxxx', term: '30 Hari' },
  { code: 'SUP-004', name: 'Mitra Mesin Abadi', category: 'Aset', contact: 'Asep · 0818-xxxx', term: '30 Hari' },
]

export const productMasters: ProductMaster[] = [
  { code: 'PRD-001', name: 'Tali', category: 'Produk Jadi', unit: 'Kg', account: '4-10000 · Penjualan Tali' },
  { code: 'PRD-002', name: 'Biji Plastik', category: 'WIP / Produk', unit: 'Kg', account: '4-10001 · Penjualan Biji' },
  { code: 'BB-001', name: 'Karung Polos', category: 'Bahan Baku', unit: 'Kg', account: '1-10201 · Persediaan BB' },
  { code: 'SP-001', name: 'Bearing Mesin', category: 'Sparepart', unit: 'Pcs', account: '1-10205 · Persediaan Sparepart' },
  { code: 'BP-001', name: 'Pewarna Plastik', category: 'Bahan Pendukung', unit: 'Kg', account: '5-10002 · Bahan Pendukung' },
]

export const assetTypeMasters: AssetTypeMaster[] = [
  { code: 'MCC', name: 'Mesin Cacah', type: 'Mesin Biji', defaultLife: '16 Tahun', accumulationAccount: '1-21004' },
  { code: 'MTL', name: 'Mesin Tali', type: 'Mesin Produksi Tali', defaultLife: '5 Tahun', accumulationAccount: '1-21005' },
  { code: 'KND', name: 'Kendaraan Operasional', type: 'Kendaraan Ops.', defaultLife: '8 Tahun', accumulationAccount: '1-21003' },
  { code: 'BGP', name: 'Bangunan Pabrik', type: 'Bangunan Pabrik', defaultLife: '20 Tahun', accumulationAccount: '1-21001' },
]

export const employeeMasters: EmployeeMaster[] = [
  { employeeId: 'EMP-001', name: 'Ahmad Fauzi', department: 'Produksi', position: 'Operator', employmentStatus: 'Tetap' },
  { employeeId: 'EMP-002', name: 'Siti Rahma', department: 'Finance', position: 'Staff Finance', employmentStatus: 'Tetap' },
  { employeeId: 'EMP-003', name: 'Dedi Suhendar', department: 'Produksi', position: 'Supervisor', employmentStatus: 'Tetap' },
  { employeeId: 'EMP-004', name: 'Rina Wati', department: 'Produksi', position: 'Operator', employmentStatus: 'Kontrak' },
]

export const shareholderMasters: ShareholderMaster[] = [
  { name: 'Koh Yadie', shares: '1.440.000', percentage: '40,00%' },
  { name: 'Pak Satria', shares: '1.200.000', percentage: '33,33%' },
  { name: 'Koh Apin', shares: '760.000', percentage: '21,11%' },
  { name: 'Pak Andri', shares: '200.000', percentage: '5,56%' },
]

export const paymentMethods = [
  'Cash',
  'Transfer Antar Bank',
  'Transfer Sesama Bank',
  'E-Wallet',
  'Kredit',
  'Payroll',
  'Virtual Account',
]

const monthNames = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]

/** Tahun buku 2026: Januari–Agustus sudah ditutup, September ke atas masih terbuka. */
export const fiscalPeriods: FiscalPeriod[] = monthNames.map((month, index) => ({
  month,
  year: 2026,
  status: index < 8 ? 'Closed' : 'Open',
}))

/** Parameter perhitungan yang dapat diubah Super Admin. */
export const systemParameters = [
  { label: 'Minimum Cash', placeholder: 'Rp 200.000.000' },
  { label: 'Pajak Dividen', placeholder: '10,0%' },
  { label: 'Nilai Residu Aset', placeholder: '1,0%' },
  { label: 'Standard Current Ratio', placeholder: '1,20' },
  { label: 'Standard Quick Ratio', placeholder: '1,20' },
  { label: 'Standard GPM', placeholder: '30,0%' },
  { label: 'Standard NPM', placeholder: '20,0%' },
  { label: 'Standard DER', placeholder: '1,80' },
  { label: 'Standard CFR', placeholder: '35,0%' },
]
