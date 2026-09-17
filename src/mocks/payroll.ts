import type { Payslip, PayrollRow } from '@/types'

export const payrollRows: PayrollRow[] = [
  {
    employeeId: 'EMP-001',
    name: 'Ahmad Fauzi',
    status: 'Operator',
    basicSalary: 5_200_000,
    overtime: 850_000,
    allowance: 300_000,
    bonus: 450_000,
    deduction: 425_000,
    takeHomePay: 6_375_000,
  },
  {
    employeeId: 'EMP-002',
    name: 'Siti Rahma',
    status: 'Staff Finance',
    basicSalary: 7_500_000,
    overtime: 0,
    allowance: 500_000,
    bonus: 750_000,
    deduction: 625_000,
    takeHomePay: 8_125_000,
  },
  {
    employeeId: 'EMP-003',
    name: 'Dedi Suhendar',
    status: 'Supervisor',
    basicSalary: 9_000_000,
    overtime: 600_000,
    allowance: 750_000,
    bonus: 1_000_000,
    deduction: 875_000,
    takeHomePay: 10_475_000,
  },
  {
    employeeId: 'EMP-004',
    name: 'Rina Wati',
    status: 'Operator',
    basicSalary: 5_200_000,
    overtime: 725_000,
    allowance: 300_000,
    bonus: 300_000,
    deduction: 410_000,
    takeHomePay: 6_115_000,
  },
]

export const payrollSummary = {
  grossTotal: 43_425_000,
  deductionTotal: 2_335_000,
  takeHomeTotal: 41_090_000,
  employeeCount: '4 Karyawan',
}

/** Slip gaji contoh untuk preview dan pengujian layout cetak A4. */
export const samplePayslip: Payslip = {
  employeeId: 'EMP-002',
  name: 'Siti Rahma',
  department: 'Finance',
  period: 'September 2026',
  paymentDate: '25 September 2026',
  earnings: [
    { label: 'Gaji Pokok', amount: 7_500_000 },
    { label: 'Upah Lembur', amount: 0 },
    { label: 'Allowance', amount: 500_000 },
    { label: 'Tunjangan / Bonus', amount: 750_000 },
  ],
  deductions: [
    { label: 'PPh 21', amount: 275_000 },
    { label: 'BPJS Ketenagakerjaan', amount: 175_000 },
    { label: 'BPJS Kesehatan', amount: 100_000 },
    { label: 'Potongan Kasbon', amount: 75_000 },
  ],
}

/** Identitas perusahaan yang dicetak pada kop slip gaji dan laporan. */
export const companyProfile = {
  name: 'TRIPLASTINDO',
  address: 'Jl. Raya Kedaung Barat No.78, Sepatan Timur, Tangerang, Banten 15520',
  email: 'Triplastindo@gmail.com',
  website: 'Triplastindo.com',
}
