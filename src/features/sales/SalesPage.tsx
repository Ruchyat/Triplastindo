import { useState } from 'react'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/common'
import { TransactionDrawer } from '@/components/financial'
import { Button } from '@/components/ui/Button'
import { TabSwitch, type TabOption } from '@/components/ui/TabSwitch'
import { useDrawer } from '@/hooks/useDisclosure'
import {
  depositActivities,
  salesDepositSummary,
  salesInvoices,
  salesSummary,
} from '@/mocks/sales'
import type { DocumentType } from '@/types'
import { DepositTable } from './components/DepositTable'
import { SalesInvoiceTable } from './components/SalesInvoiceTable'

type SalesTab = 'invoices' | 'deposits'

const tabs: TabOption<SalesTab>[] = [
  { value: 'invoices', label: 'Invoice Penjualan' },
  { value: 'deposits', label: 'Deposit Pelanggan' },
]

/**
 * Halaman Penjualan.
 *
 * Invoice penjualan kredit langsung membentuk piutang, dan saldo deposit
 * customer dipotong otomatis sebelum sisa piutang dihitung.
 */
export function SalesPage() {
  const drawer = useDrawer<DocumentType>()
  const [tab, setTab] = useState<SalesTab>('invoices')

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Transaksi / Penjualan"
        title="Penjualan"
        description="Catat invoice, piutang, dan deposit pelanggan"
        actions={
          tab === 'invoices' ? (
            <Button onClick={() => drawer.open('sale')}>
              <Plus size={16} />
              Buat Invoice
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => drawer.open('refund')}>
                Kembalikan Deposit
              </Button>
              <Button onClick={() => drawer.open('deposit')}>
                <Plus size={16} />
                Terima Deposit
              </Button>
            </>
          )
        }
      />

      <TabSwitch options={tabs} value={tab} onChange={setTab} />

      {tab === 'invoices' ? (
        <SalesInvoiceTable invoices={salesInvoices} summary={salesSummary} />
      ) : (
        <DepositTable activities={depositActivities} summary={salesDepositSummary} />
      )}

      {drawer.active && <TransactionDrawer type={drawer.active} onClose={drawer.close} />}
    </div>
  )
}
