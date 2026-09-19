import {
  ArrowLeftRight,
  BadgeDollarSign,
  Banknote,
  BookOpen,
  Boxes,
  ChartNoAxesCombined,
  CircleDollarSign,
  Factory,
  HandCoins,
  LayoutDashboard,
  NotebookPen,
  NotebookTabs,
  ReceiptText,
  Scale,
  Settings,
  ShoppingCart,
  Store,
  Truck,
  UsersRound,
  WalletCards,
  type LucideIcon,
} from 'lucide-react'
import { routePaths } from '@/app/router/paths'
import type { Capability } from '@/features/auth/permissions'

export type NavItem = {
  label: string
  path: string
  icon: LucideIcon
  /** Hak yang dibutuhkan untuk melihat menu ini. */
  requires: Capability
}

export type NavGroup = {
  label: string
  items: NavItem[]
}

/**
 * Struktur menu sidebar.
 *
 * Kelompok TRANSAKSI mengikuti pendekatan transaction-first: pengguna
 * mencatat kejadian bisnis (penjualan, pembelian, pengeluaran, pembayaran),
 * sedangkan Jurnal Manual hanya dipakai Finance untuk penyesuaian dan koreksi.
 */
export const navigationGroups: NavGroup[] = [
  {
    label: 'OVERVIEW',
    items: [{ label: 'Dashboard', path: routePaths.dashboard, icon: LayoutDashboard, requires: 'dashboard' }],
  },
  {
    label: 'LAPORAN',
    items: [
      { label: 'Laporan Laba Rugi', path: routePaths.profitLoss, icon: ChartNoAxesCombined, requires: 'reports' },
      { label: 'Laporan Neraca', path: routePaths.balanceSheet, icon: Scale, requires: 'reports' },
      { label: 'Laporan Arus Kas', path: routePaths.cashFlow, icon: ArrowLeftRight, requires: 'reports' },
      { label: 'Buku Besar', path: routePaths.generalLedger, icon: BookOpen, requires: 'ledger' },
    ],
  },
  {
    label: 'TRANSAKSI',
    items: [
      { label: 'Penjualan', path: routePaths.sales, icon: Store, requires: 'transactions.read' },
      { label: 'Pembelian', path: routePaths.purchases, icon: ShoppingCart, requires: 'transactions.read' },
      { label: 'Pengeluaran', path: routePaths.expenses, icon: CircleDollarSign, requires: 'transactions.read' },
      { label: 'Kas & Bank', path: routePaths.cashBank, icon: Banknote, requires: 'transactions.read' },
      { label: 'Jurnal Manual', path: routePaths.manualJournal, icon: NotebookPen, requires: 'transactions.write' },
      { label: 'Jurnal Umum', path: routePaths.journals, icon: NotebookTabs, requires: 'ledger' },
    ],
  },
  {
    label: 'KEUANGAN',
    items: [
      { label: 'Utang', path: routePaths.payables, icon: HandCoins, requires: 'transactions.read' },
      { label: 'Piutang', path: routePaths.receivables, icon: WalletCards, requires: 'transactions.read' },
      { label: 'Deposit Pelanggan', path: routePaths.customerDeposits, icon: CircleDollarSign, requires: 'transactions.read' },
      { label: 'Customer', path: routePaths.customers, icon: Store, requires: 'transactions.read' },
      { label: 'Supplier', path: routePaths.suppliers, icon: Truck, requires: 'transactions.read' },
      { label: 'Bagi Hasil', path: routePaths.profitSharing, icon: BadgeDollarSign, requires: 'dividends.read' },
    ],
  },
  {
    label: 'OPERASIONAL',
    items: [
      { label: 'Inventory & Penjualan', path: routePaths.inventorySummary, icon: Boxes, requires: 'transactions.read' },
      { label: 'Aset & Depresiasi', path: routePaths.assets, icon: Factory, requires: 'transactions.read' },
    ],
  },
  {
    label: 'PAYROLL',
    items: [
      { label: 'Gaji Karyawan', path: routePaths.payroll, icon: UsersRound, requires: 'payroll.read' },
      { label: 'Slip Gaji', path: routePaths.payslips, icon: ReceiptText, requires: 'payroll.read' },
    ],
  },
  {
    label: 'SISTEM',
    items: [{ label: 'Setup', path: routePaths.setup, icon: Settings, requires: 'setup.read' }],
  },
]

/** Kelompok menu yang boleh dilihat sebuah peran; kelompok kosong disembunyikan. */
export function navigationFor(isAllowed: (capability: Capability) => boolean): NavGroup[] {
  return navigationGroups
    .map(group => ({ ...group, items: group.items.filter(item => isAllowed(item.requires)) }))
    .filter(group => group.items.length > 0)
}
