import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { toPath } from '@/app/router'
import { InfoNote, PageHeader } from '@/components/common'
import { Button } from '@/components/ui/Button'
import { DepositsView } from '@/features/deposits/DepositsView'

/**
 * Halaman Deposit Pelanggan.
 *
 * Deposit adalah modul mandiri: uang titipan dapat diterima tanpa invoice
 * lebih dulu, dicatat sebagai kewajiban, lalu dipotong saat invoice penjualan
 * diposting bila pencatat memilihnya.
 */
export function CustomerDepositsPage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Keuangan / Deposit Pelanggan"
        title="Deposit Pelanggan"
        description="Kelola uang titipan customer sebelum ada invoice penjualan"
        actions={
          <>
            <Button variant="outline" onClick={() => navigate(toPath.depositNew('refunded'))}>
              Kembalikan Deposit
            </Button>
            <Button onClick={() => navigate(toPath.depositNew('received'))}>
              <Plus size={16} />
              Terima Deposit
            </Button>
          </>
        }
      />

      <InfoNote>
        Deposit dapat diterima tanpa penjualan atau invoice. Saat invoice diposting, saldo deposit
        customer dapat dipakai memotong tagihannya — pencatat yang memutuskan lewat pilihan pada
        form invoice.
      </InfoNote>

      <DepositsView showNote={false} />
    </div>
  )
}
