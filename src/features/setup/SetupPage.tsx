import { useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/common'
import {
  CompanyProfilePanel,
  FiscalPeriodPanel,
  ParameterPanel,
  PaymentMethodPanel,
} from './components/ConfigurationPanels'
import { usePermissions } from '@/features/auth/usePermissions'
import { AccountsPanel } from './components/AccountsPanel'
import { AssetTypesPanel } from './components/AssetTypesPanel'
import { EmployeesPanel } from './components/EmployeesPanel'
import { OpeningBalancePanel } from './components/OpeningBalancePanel'
import { PartyPanel } from './components/PartyPanel'
import { ProductsPanel } from './components/ProductsPanel'
import { ShareholdersPanel } from './components/ShareholdersPanel'
import { UsersPanel } from './components/UsersPanel'
import { SetupNav } from './components/SetupNav'
import { setupTabs, type SetupTabId } from './tabs'

const panels: Record<SetupTabId, ReactNode> = {
  coa: <AccountsPanel />,
  opening: <OpeningBalancePanel />,
  customers: <PartyPanel kind="customer" />,
  suppliers: <PartyPanel kind="supplier" />,
  products: <ProductsPanel />,
  assets: <AssetTypesPanel />,
  employees: <EmployeesPanel />,
  shareholders: <ShareholdersPanel />,
  users: <UsersPanel />,
  payments: <PaymentMethodPanel />,
  periods: <FiscalPeriodPanel />,
  company: <CompanyProfilePanel />,
  parameters: <ParameterPanel />,
}

/** Halaman Setup: seluruh master data dan parameter perhitungan aplikasi. */
export function SetupPage() {
  // `?tab=customers` membuka langsung tab tertentu, dipakai tautan dari halaman lain.
  const [params] = useSearchParams()
  const permissions = usePermissions()
  const visibleTabs = setupTabs.filter(item => permissions.can(item.requires))
  const requested = params.get('tab')
  const [tab, setTab] = useState<SetupTabId>(
    visibleTabs.some(item => item.id === requested) ? (requested as SetupTabId) : (visibleTabs[0]?.id ?? 'coa'),
  )

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Sistem / Setup"
        title="Setup & Master Data"
        description="Kelola konfigurasi dasar aplikasi Finance Triplastindo"
      />

      <div className="grid gap-5 xl:grid-cols-[240px_1fr]">
        <SetupNav tabs={visibleTabs} active={tab} onChange={setTab} />
        <div>{panels[tab]}</div>
      </div>
    </div>
  )
}
