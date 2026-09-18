import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { toPath } from '@/app/router'
import { PageHeader } from '@/components/common'
import { Button } from '@/components/ui/Button'
import { TabSwitch, type TabOption } from '@/components/ui/TabSwitch'
import { DepositsView } from '@/features/deposits/DepositsView'
import { useAsync } from '@/hooks/useAsync'
import { masterDataService } from '@/services/masterDataService'
import { InvoicesTab } from './tabs/InvoicesTab'
import { ReceiptsTab } from './tabs/ReceiptsTab'
import { useReceipts } from './useReceipts'
import { useSalesInvoices } from './useSalesInvoices'

type SalesTab = 'invoices' | 'receipts' | 'deposits'

const tabs: TabOption<SalesTab>[] = [
  { value: 'invoices', label: 'Invoice Penjualan' },
  { value: 'receipts', label: 'Penerimaan Pembayaran' },
  { value: 'deposits', label: 'Deposit Pelanggan' },
]

/**
 * Halaman Penjualan — daftar dokumennya.
 *
 * Halaman ini hanya menampilkan daftar. Membuat dan membuka dokumen berpindah
 * ke halaman tersendiri, karena pencatatan transaksi adalah pekerjaan inti
 * yang memerlukan ruang dan alamatnya sendiri.
 */
export function SalesPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<SalesTab>('invoices')

  const sales = useSalesInvoices()
  const receipts = useReceipts()

  // Daftar customer hanya dipakai isi dropdown penyaring di kedua tab.
  const loadCustomers = useCallback(() => masterDataService.customers(), [])
  const master = useAsync(loadCustomers)
  const customers = master.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Transaksi / Penjualan"
        title="Penjualan"
        description="Catat invoice, pelunasan piutang, dan deposit pelanggan"
        actions={<SalesActions tab={tab} navigate={navigate} />}
      />

      <TabSwitch options={tabs} value={tab} onChange={setTab} />

      {tab === 'invoices' && (
        <InvoicesTab sales={sales} customers={customers} masterError={master.error} />
      )}

      {tab === 'receipts' && <ReceiptsTab receipts={receipts} customers={customers} />}

      {tab === 'deposits' && <DepositsView />}
    </div>
  )
}

type ActionProps = {
  tab: SalesTab
  navigate: ReturnType<typeof useNavigate>
}

/** Tombol aksi di kepala halaman, berbeda untuk tiap tab. */
function SalesActions({ tab, navigate }: ActionProps) {
  if (tab === 'invoices') {
    return (
      <>
        <Button variant="outline" onClick={() => navigate(toPath.receiptNew())}>
          Terima Pembayaran
        </Button>
        <Button onClick={() => navigate(toPath.salesInvoiceNew())}>
          <Plus size={16} />
          Buat Invoice
        </Button>
      </>
    )
  }

  if (tab === 'receipts') {
    return (
      <Button onClick={() => navigate(toPath.receiptNew())}>
        <Plus size={16} />
        Terima Pembayaran
      </Button>
    )
  }

  return (
    <>
      <Button variant="outline" onClick={() => navigate(toPath.depositNew('refunded'))}>
        Kembalikan Deposit
      </Button>
      <Button onClick={() => navigate(toPath.depositNew('received'))}>
        <Plus size={16} />
        Terima Deposit
      </Button>
    </>
  )
}
