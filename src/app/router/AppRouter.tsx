import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from '@/features/auth/LoginPage'
import { AppLayout } from '@/layouts/AppLayout'
import * as pages from './lazyPages'
import { routePaths } from './paths'
import { RequireAuth } from './RequireAuth'

/** Pemetaan route ke komponen halamannya. */
const routes = [
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

export function AppRouter() {
  return (
    <Routes>
      <Route path={routePaths.login} element={<LoginPage />} />

      {/* Seluruh halaman di bawah ini hanya terbuka bagi pengguna yang sudah masuk. */}
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to={routePaths.dashboard} replace />} />
          {routes.map(route => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
          <Route path="*" element={<Navigate to={routePaths.dashboard} replace />} />
        </Route>
      </Route>
    </Routes>
  )
}
