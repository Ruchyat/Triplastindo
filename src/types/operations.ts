/** Rekap penjualan dan persediaan satu produk pada satu bulan. */
export type InventoryMonth = {
  month: string
  soldKg: number
  sales: number
  qtyInKg: number
  qtyOutKg: number
  remainingKg: number
  inventoryValue: number
}

/** Satu aset tetap beserta hasil perhitungan depresiasi garis lurusnya. */
export type FixedAsset = {
  code: string
  name: string
  type: string
  purchaseDate: string
  value: number
  usefulLifeYears: number
  monthlyDepreciation: number
  bookValue: number
}

/** Rekap beban depresiasi per jenis aset pada satu periode. */
export type DepreciationSummaryRow = {
  assetType: string
  assetValue: number
  depreciationExpense: number
}

/** Satu baris payroll karyawan pada satu periode. */
export type PayrollRow = {
  employeeId: string
  name: string
  status: string
  basicSalary: number
  overtime: number
  allowance: number
  bonus: number
  deduction: number
  takeHomePay: number
}

/** Satu komponen pendapatan atau potongan pada slip gaji. */
export type PayslipComponent = {
  label: string
  amount: number
}

/** Slip gaji satu karyawan untuk satu periode. */
export type Payslip = {
  employeeId: string
  name: string
  department: string
  period: string
  paymentDate: string
  earnings: PayslipComponent[]
  deductions: PayslipComponent[]
}
