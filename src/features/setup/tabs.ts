import {
  Building2,
  CalendarRange,
  CreditCard,
  Database,
  KeyRound,
  Package,
  Scale,
  Settings2,
  Store,
  Truck,
  UserRoundCog,
  Users,
  WalletCards,
  type LucideIcon,
} from 'lucide-react'
import type { Capability } from '@/features/auth/permissions'

export type SetupTabId =
  | 'coa'
  | 'opening'
  | 'customers'
  | 'suppliers'
  | 'products'
  | 'assets'
  | 'employees'
  | 'shareholders'
  | 'payments'
  | 'periods'
  | 'company'
  | 'parameters'
  | 'users'

export type SetupTab = {
  id: SetupTabId
  label: string
  icon: LucideIcon
  /** Hak yang dibutuhkan untuk melihat tab ini. */
  requires: Capability
}

/** Daftar tab master data pada halaman Setup. */
export const setupTabs: SetupTab[] = [
  { id: 'coa', label: 'Chart of Accounts', icon: WalletCards, requires: 'setup.read' },
  { id: 'opening', label: 'Saldo Awal', icon: Scale, requires: 'setup.master' },
  { id: 'customers', label: 'Customer', icon: Store, requires: 'setup.read' },
  { id: 'suppliers', label: 'Supplier', icon: Truck, requires: 'setup.read' },
  { id: 'products', label: 'Produk & Item', icon: Package, requires: 'setup.read' },
  { id: 'assets', label: 'Master Jenis Aset', icon: Database, requires: 'setup.read' },
  { id: 'employees', label: 'Master Karyawan', icon: Users, requires: 'setup.read' },
  { id: 'shareholders', label: 'Pemegang Saham', icon: UserRoundCog, requires: 'setup.read' },
  { id: 'payments', label: 'Jenis Pembayaran', icon: CreditCard, requires: 'setup.read' },
  { id: 'periods', label: 'Tahun Buku / Periode', icon: CalendarRange, requires: 'setup.read' },
  { id: 'company', label: 'Profil Perusahaan', icon: Building2, requires: 'setup.read' },
  { id: 'parameters', label: 'Parameter', icon: Settings2, requires: 'setup.read' },
  { id: 'users', label: 'Pengguna & Peran', icon: KeyRound, requires: 'setup.admin' },
]
