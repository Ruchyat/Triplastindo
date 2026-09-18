import { lazy } from 'react'

/**
 * Setiap halaman dimuat terpisah agar bundel awal tetap ringan.
 *
 * Halaman diekspor sebagai named export, sehingga tiap impor dipetakan
 * ulang menjadi default export yang dibutuhkan `React.lazy`.
 */
export const DashboardPage = lazy(() =>
  import('@/features/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })),
)

export const SalesPage = lazy(() =>
  import('@/features/sales/SalesPage').then(m => ({ default: m.SalesPage })),
)

export const PurchasesPage = lazy(() =>
  import('@/features/purchases/PurchasesPage').then(m => ({ default: m.PurchasesPage })),
)

export const ExpensesPage = lazy(() =>
  import('@/features/expenses/ExpensesPage').then(m => ({ default: m.ExpensesPage })),
)

export const CashBankPage = lazy(() =>
  import('@/features/cash-bank/CashBankPage').then(m => ({ default: m.CashBankPage })),
)

export const CustomerDepositsPage = lazy(() =>
  import('@/features/customer-deposits/CustomerDepositsPage').then(m => ({
    default: m.CustomerDepositsPage,
  })),
)

export const CustomersPage = lazy(() =>
  import('@/features/customers/CustomersPage').then(m => ({ default: m.CustomersPage })),
)

export const SuppliersPage = lazy(() =>
  import('@/features/suppliers/SuppliersPage').then(m => ({ default: m.SuppliersPage })),
)

export const ManualJournalPage = lazy(() =>
  import('@/features/transactions/ManualJournalPage').then(m => ({ default: m.ManualJournalPage })),
)

export const JournalsPage = lazy(() =>
  import('@/features/journals/JournalsPage').then(m => ({ default: m.JournalsPage })),
)

export const LedgerPage = lazy(() =>
  import('@/features/ledger/LedgerPage').then(m => ({ default: m.LedgerPage })),
)

export const ProfitLossPage = lazy(() =>
  import('@/features/reports/profit-loss/ProfitLossPage').then(m => ({ default: m.ProfitLossPage })),
)

export const BalanceSheetPage = lazy(() =>
  import('@/features/reports/balance-sheet/BalanceSheetPage').then(m => ({
    default: m.BalanceSheetPage,
  })),
)

export const CashFlowPage = lazy(() =>
  import('@/features/reports/cash-flow/CashFlowPage').then(m => ({ default: m.CashFlowPage })),
)

export const PayablesPage = lazy(() =>
  import('@/features/payables/PayablesPage').then(m => ({ default: m.PayablesPage })),
)

export const ReceivablesPage = lazy(() =>
  import('@/features/receivables/ReceivablesPage').then(m => ({ default: m.ReceivablesPage })),
)

export const ProfitSharingPage = lazy(() =>
  import('@/features/profit-sharing/ProfitSharingPage').then(m => ({ default: m.ProfitSharingPage })),
)

export const InventoryPage = lazy(() =>
  import('@/features/inventory/InventoryPage').then(m => ({ default: m.InventoryPage })),
)

export const AssetsPage = lazy(() =>
  import('@/features/assets/AssetsPage').then(m => ({ default: m.AssetsPage })),
)

export const PayrollPage = lazy(() =>
  import('@/features/payroll/PayrollPage').then(m => ({ default: m.PayrollPage })),
)

export const PayslipsPage = lazy(() =>
  import('@/features/payslips/PayslipsPage').then(m => ({ default: m.PayslipsPage })),
)

export const SetupPage = lazy(() =>
  import('@/features/setup/SetupPage').then(m => ({ default: m.SetupPage })),
)

/*
 * Halaman dokumen transaksi.
 *
 * Form dan detail masing-masing halaman penuh, bukan panel: pencatatan
 * transaksi adalah pekerjaan inti yang memerlukan ruang, alamat sendiri, dan
 * perlindungan terhadap isian yang belum tersimpan.
 */

export const NewSalesInvoicePage = lazy(() =>
  import('@/features/sales/pages/NewSalesInvoicePage').then(m => ({
    default: m.NewSalesInvoicePage,
  })),
)

export const SalesInvoicePage = lazy(() =>
  import('@/features/sales/pages/SalesInvoicePage').then(m => ({ default: m.SalesInvoicePage })),
)

export const NewReceiptPage = lazy(() =>
  import('@/features/sales/pages/NewReceiptPage').then(m => ({ default: m.NewReceiptPage })),
)

export const ReceiptPage = lazy(() =>
  import('@/features/sales/pages/ReceiptPage').then(m => ({ default: m.ReceiptPage })),
)

export const NewDepositPage = lazy(() =>
  import('@/features/deposits/pages/NewDepositPage').then(m => ({ default: m.NewDepositPage })),
)

export const CustomerDepositPage = lazy(() =>
  import('@/features/deposits/pages/CustomerDepositPage').then(m => ({
    default: m.CustomerDepositPage,
  })),
)

export const NewPurchaseBillPage = lazy(() =>
  import('@/features/purchases/pages/NewPurchaseBillPage').then(m => ({
    default: m.NewPurchaseBillPage,
  })),
)

export const PurchaseBillPage = lazy(() =>
  import('@/features/purchases/pages/PurchaseBillPage').then(m => ({ default: m.PurchaseBillPage })),
)
