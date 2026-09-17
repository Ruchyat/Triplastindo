import { Plus } from 'lucide-react'
import { InfoNote, PageHeader } from '@/components/common'
import { TransactionDrawer } from '@/components/financial'
import { Button } from '@/components/ui/Button'
import { DepositTable } from '@/features/sales/components/DepositTable'
import { useDrawer } from '@/hooks/useDisclosure'
import { customerDepositSummary, depositActivities } from '@/mocks/sales'
import type { DocumentType } from '@/types'

/**
 * Halaman Deposit Pelanggan.
 *
 * Deposit adalah modul mandiri: uang titipan dapat diterima tanpa invoice
 * lebih dulu, dicatat sebagai kewajiban, lalu dipotong otomatis ketika
 * invoice penjualan dibuat.
 */
export function CustomerDepositsPage() {
  const drawer = useDrawer<DocumentType>()

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Keuangan / Deposit Pelanggan"
        title="Deposit Pelanggan"
        description="Kelola uang titipan customer sebelum ada invoice penjualan"
        actions={
          <>
            <Button variant="outline" onClick={() => drawer.open('refund')}>
              Kembalikan Deposit
            </Button>
            <Button onClick={() => drawer.open('deposit')}>
              <Plus size={16} />
              Terima Deposit
            </Button>
          </>
        }
      />

      <InfoNote>
        Deposit dapat diterima tanpa penjualan atau invoice. Saat invoice dibuat, saldo deposit
        customer akan dipotong otomatis terlebih dahulu. Customer tidak menyimpan saldo deposit dan
        piutang terbuka secara bersamaan.
      </InfoNote>

      <DepositTable
        activities={depositActivities}
        summary={customerDepositSummary}
        showNote={false}
      />

      {drawer.active && <TransactionDrawer type={drawer.active} onClose={drawer.close} />}
    </div>
  )
}
