import { useState, type ReactNode } from 'react'
import { PageHeader } from '@/components/common'
import {
  CompanyProfilePanel,
  FiscalPeriodPanel,
  ParameterPanel,
  PaymentMethodPanel,
} from './components/ConfigurationPanels'
import {
  AssetTypeMasterPanel,
  ChartOfAccountsPanel,
  CustomerMasterPanel,
  EmployeeMasterPanel,
  ProductMasterPanel,
  ShareholderMasterPanel,
  SupplierMasterPanel,
} from './components/MasterDataPanels'
import { SetupNav } from './components/SetupNav'
import type { SetupTabId } from './tabs'

const panels: Record<SetupTabId, ReactNode> = {
  coa: <ChartOfAccountsPanel />,
  customers: <CustomerMasterPanel />,
  suppliers: <SupplierMasterPanel />,
  products: <ProductMasterPanel />,
  assets: <AssetTypeMasterPanel />,
  employees: <EmployeeMasterPanel />,
  shareholders: <ShareholderMasterPanel />,
  payments: <PaymentMethodPanel />,
  periods: <FiscalPeriodPanel />,
  company: <CompanyProfilePanel />,
  parameters: <ParameterPanel />,
}

/** Halaman Setup: seluruh master data dan parameter perhitungan aplikasi. */
export function SetupPage() {
  const [tab, setTab] = useState<SetupTabId>('coa')

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Sistem / Setup"
        title="Setup & Master Data"
        description="Kelola konfigurasi dasar aplikasi Finance Triplastindo"
      />

      <div className="grid gap-5 xl:grid-cols-[240px_1fr]">
        <SetupNav active={tab} onChange={setTab} />
        <div>{panels[tab]}</div>
      </div>
    </div>
  )
}
