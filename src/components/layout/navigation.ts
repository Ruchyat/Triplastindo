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

export type NavItem = {
  label: string
  path: string
  icon: LucideIcon
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
    items: [{ label: 'Dashboard', path: routePaths.dashboard, icon: LayoutDashboard }],
  },
  {
    label: 'LAPORAN',
    items: [
      { label: 'Laporan Laba Rugi', path: routePaths.profitLoss, icon: ChartNoAxesCombined },
      { label: 'Laporan Neraca', path: routePaths.balanceSheet, icon: Scale },
      { label: 'Laporan Arus Kas', path: routePaths.cashFlow, icon: ArrowLeftRight },
      { label: 'Buku Besar', path: routePaths.generalLedger, icon: BookOpen },
    ],
  },
  {
    label: 'TRANSAKSI',
    items: [
      { label: 'Penjualan', path: routePaths.sales, icon: Store },
      { label: 'Pembelian', path: routePaths.purchases, icon: ShoppingCart },
      { label: 'Pengeluaran', path: routePaths.expenses, icon: CircleDollarSign },
      { label: 'Kas & Bank', path: routePaths.cashBank, icon: Banknote },
      { label: 'Jurnal Manual', path: routePaths.manualJournal, icon: NotebookPen },
      { label: 'Jurnal Umum', path: routePaths.journals, icon: NotebookTabs },
    ],
  },
  {
    label: 'KEUANGAN',
    items: [
      { label: 'Utang', path: routePaths.payables, icon: HandCoins },
      { label: 'Piutang', path: routePaths.receivables, icon: WalletCards },
      { label: 'Deposit Pelanggan', path: routePaths.customerDeposits, icon: CircleDollarSign },
      { label: 'Customer', path: routePaths.customers, icon: Store },
      { label: 'Supplier', path: routePaths.suppliers, icon: Truck },
      { label: 'Bagi Hasil', path: routePaths.profitSharing, icon: BadgeDollarSign },
    ],
  },
  {
    label: 'OPERASIONAL',
    items: [
      { label: 'Inventory & Penjualan', path: routePaths.inventorySummary, icon: Boxes },
      { label: 'Aset & Depresiasi', path: routePaths.assets, icon: Factory },
    ],
  },
  {
    label: 'PAYROLL',
    items: [
      { label: 'Gaji Karyawan', path: routePaths.payroll, icon: UsersRound },
      { label: 'Slip Gaji', path: routePaths.payslips, icon: ReceiptText },
    ],
  },
  {
    label: 'SISTEM',
    items: [{ label: 'Setup', path: routePaths.setup, icon: Settings }],
  },
]
