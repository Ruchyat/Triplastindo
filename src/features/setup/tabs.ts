import {
  Building2,
  CalendarRange,
  CreditCard,
  Database,
  Package,
  Settings2,
  Store,
  Truck,
  UserRoundCog,
  Users,
  WalletCards,
  type LucideIcon,
} from 'lucide-react'

export type SetupTabId =
  | 'coa'
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

export type SetupTab = {
  id: SetupTabId
  label: string
  icon: LucideIcon
}

/** Daftar tab master data pada halaman Setup. */
export const setupTabs: SetupTab[] = [
  { id: 'coa', label: 'Chart of Accounts', icon: WalletCards },
  { id: 'customers', label: 'Customer', icon: Store },
  { id: 'suppliers', label: 'Supplier', icon: Truck },
  { id: 'products', label: 'Produk & Item', icon: Package },
  { id: 'assets', label: 'Master Aset', icon: Database },
  { id: 'employees', label: 'Master Karyawan', icon: Users },
  { id: 'shareholders', label: 'Pemegang Saham', icon: UserRoundCog },
  { id: 'payments', label: 'Jenis Pembayaran', icon: CreditCard },
  { id: 'periods', label: 'Tahun Buku / Periode', icon: CalendarRange },
  { id: 'company', label: 'Profil Perusahaan', icon: Building2 },
  { id: 'parameters', label: 'Parameter', icon: Settings2 },
]
