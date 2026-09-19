import type { UserRole } from '@/types/auth'

/**
 * Matriks hak akses per modul, cermin dari `routes/api.php` backend dan bagian
 * 4 dokumen spesifikasi. Dipakai untuk menyembunyikan menu dan tombol yang
 * pasti ditolak API — penegakannya tetap di backend.
 */
export type Capability =
  | 'dashboard'
  | 'reports'
  | 'ledger'
  | 'transactions.read'
  | 'transactions.write'
  | 'assets.write'
  | 'payroll.read'
  | 'payroll.write'
  | 'dividends.read'
  | 'dividends.write'
  | 'dividends.approve'
  | 'setup.read'
  | 'setup.master'
  | 'setup.employees'
  | 'setup.admin'

const matrix: Record<UserRole, Capability[]> = {
  super_admin: [
    'dashboard', 'reports', 'ledger', 'transactions.read', 'transactions.write', 'assets.write',
    'payroll.read', 'payroll.write', 'dividends.read', 'dividends.write', 'dividends.approve',
    'setup.read', 'setup.master', 'setup.employees', 'setup.admin',
  ],
  finance: [
    'dashboard', 'reports', 'ledger', 'transactions.read', 'transactions.write', 'assets.write',
    'payroll.read', 'dividends.read', 'dividends.write', 'setup.read', 'setup.master',
  ],
  hr: ['payroll.read', 'payroll.write', 'setup.read', 'setup.employees'],
  direksi: ['dashboard', 'reports', 'ledger', 'transactions.read', 'payroll.read', 'dividends.read', 'dividends.approve', 'setup.read'],
  viewer: ['dashboard', 'reports', 'dividends.read'],
}

export function can(role: UserRole | undefined, capability: Capability): boolean {
  return role !== undefined && matrix[role].includes(capability)
}
