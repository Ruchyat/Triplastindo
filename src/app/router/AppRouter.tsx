import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { LoginPage } from '@/features/auth/LoginPage'
import { AppLayout } from '@/layouts/AppLayout'
import * as pages from './lazyPages'
import { documentRoutes, routePaths } from './paths'
import { HomeRedirect } from './HomeRedirect'
import { RequireAuth } from './RequireAuth'

/**
 * Halaman yang dicapai dari sidebar.
 *
 * Halaman dokumen — form dan detail transaksi — didaftarkan terpisah di bawah,
 * karena alamatnya memuat identitas dokumen dan tidak muncul di menu.
 */
const menuRoutes = [
  { path: routePaths.dashboard, element: <pages.DashboardPage /> },

  { path: routePaths.sales, element: <pages.SalesPage /> },
  { path: routePaths.purchases, element: <pages.PurchasesPage /> },
  { path: routePaths.expenses, element: <pages.ExpensesPage /> },
  { path: routePaths.cashBank, element: <pages.CashBankPage /> },
  { path: routePaths.manualJournal, element: <pages.ManualJournalPage /> },
  { path: routePaths.journals, element: <pages.JournalsPage /> },

  { path: routePaths.payables, element: <pages.PayablesPage /> },
  { path: routePaths.receivables, element: <pages.ReceivablesPage /> },
  { path: routePaths.customerDeposits, element: <pages.CustomerDepositsPage /> },
  { path: routePaths.customers, element: <pages.CustomersPage /> },
  { path: routePaths.suppliers, element: <pages.SuppliersPage /> },
  { path: routePaths.profitSharing, element: <pages.ProfitSharingPage /> },

  { path: routePaths.generalLedger, element: <pages.LedgerPage /> },
  { path: routePaths.profitLoss, element: <pages.ProfitLossPage /> },
  { path: routePaths.balanceSheet, element: <pages.BalanceSheetPage /> },
  { path: routePaths.cashFlow, element: <pages.CashFlowPage /> },

  { path: routePaths.inventorySummary, element: <pages.InventoryPage /> },
  { path: routePaths.assets, element: <pages.AssetsPage /> },
  { path: routePaths.payroll, element: <pages.PayrollPage /> },
  { path: routePaths.payslips, element: <pages.PayslipsPage /> },

  { path: routePaths.setup, element: <pages.SetupPage /> },
]

/** Form dan detail dokumen transaksi, masing-masing halaman penuh. */
const documentPages = [
  // Urutannya penting: `new` harus lebih dahulu agar tidak tertangkap `:id`.
  { path: documentRoutes.salesInvoiceNew, element: <pages.NewSalesInvoicePage /> },
  { path: documentRoutes.salesInvoice, element: <pages.SalesInvoicePage /> },
  { path: documentRoutes.receiptNew, element: <pages.NewReceiptPage /> },
  { path: documentRoutes.receipt, element: <pages.ReceiptPage /> },
  { path: documentRoutes.depositNew, element: <pages.NewDepositPage /> },
  { path: documentRoutes.depositCard, element: <pages.CustomerDepositPage /> },
  { path: documentRoutes.purchaseBillNew, element: <pages.NewPurchaseBillPage /> },
  { path: documentRoutes.purchaseBill, element: <pages.PurchaseBillPage /> },
  { path: documentRoutes.supplierPaymentNew, element: <pages.NewSupplierPaymentPage /> },
  { path: documentRoutes.supplierPayment, element: <pages.SupplierPaymentPage /> },
  { path: documentRoutes.expenseNew, element: <pages.NewExpensePage /> },
  { path: documentRoutes.expense, element: <pages.ExpensePage /> },
  { path: documentRoutes.cashTransferNew, element: <pages.NewCashTransferPage /> },
  { path: documentRoutes.cashTransfer, element: <pages.CashTransferPage /> },
]

/**
 * Router aplikasi.
 *
 * Memakai `createBrowserRouter`, bukan `<BrowserRouter>`, karena `useBlocker`
 * — yang menahan perpindahan halaman ketika ada isian yang belum tersimpan —
 * hanya tersedia pada data router.
 */
const router = createBrowserRouter([
  { path: routePaths.login, element: <LoginPage /> },

  // Seluruh halaman di bawah ini hanya terbuka bagi pengguna yang sudah masuk.
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <HomeRedirect /> },
          ...documentPages,
          ...menuRoutes,
          { path: '*', element: <HomeRedirect /> },
        ],
      },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
