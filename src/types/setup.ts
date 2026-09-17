/** Satu akun pada Chart of Accounts. */
export type Account = {
  code: string
  name: string
  category: string
  normalBalance: 'Debit' | 'Kredit'
  active: boolean
}

/** Master customer yang dipakai invoice penjualan dan piutang. */
export type CustomerMaster = {
  code: string
  name: string
  contact: string
  term: string
  creditLimit: string
}

/** Master supplier yang dipakai tagihan pembelian dan utang. */
export type SupplierMaster = {
  code: string
  name: string
  category: string
  contact: string
  term: string
}

/** Master item transaksi beserta pemetaan akun akuntansinya. */
export type ProductMaster = {
  code: string
  name: string
  category: string
  unit: string
  account: string
}

/** Master jenis aset beserta umur manfaat dan akun akumulasinya. */
export type AssetTypeMaster = {
  code: string
  name: string
  type: string
  defaultLife: string
  accumulationAccount: string
}

/** Master karyawan. Departemen dan posisi wajib diisi agar slip gaji lengkap. */
export type EmployeeMaster = {
  employeeId: string
  name: string
  department: string
  position: string
  employmentStatus: string
}

/** Master pemegang saham. */
export type ShareholderMaster = {
  name: string
  shares: string
  percentage: string
}

/** Status satu bulan pada tahun buku. */
export type FiscalPeriod = {
  month: string
  year: number
  status: 'Open' | 'Closed'
}
