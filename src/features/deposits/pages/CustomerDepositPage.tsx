import { useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { routePaths, toPath } from '@/app/router'
import { InfoNote, PageHeader } from '@/components/common'
import { Button } from '@/components/ui/Button'
import { useAsync } from '@/hooks/useAsync'
import { masterDataService } from '@/services/masterDataService'
import { CustomerDepositCard } from '../components'

/** Halaman kartu deposit satu customer. */
export function CustomerDepositPage() {
  const { customerId } = useParams()
  const navigate = useNavigate()
  const id = Number(customerId)

  // Hanya untuk mengetahui nama customernya; kartunya memuat mutasinya sendiri.
  const loadCustomers = useCallback(() => masterDataService.customers(), [])
  const customers = useAsync(loadCustomers)
  const customer = (customers.data ?? []).find(candidate => candidate.id === id)

  if (!Number.isFinite(id)) {
    return <InfoNote tone="red">Alamat kartu deposit tidak dikenali.</InfoNote>
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Keuangan / Deposit Pelanggan"
        title={customer?.name ?? 'Kartu Deposit'}
        description="Riwayat titipan, pemakaian pada invoice, dan pengembaliannya"
        actions={
          <Button variant="outline" onClick={() => navigate(routePaths.customerDeposits)}>
            <ArrowLeft size={16} />
            Daftar Deposit
          </Button>
        }
      />

      <CustomerDepositCard
        customerId={id}
        customerName={customer?.name ?? 'customer ini'}
        onChanged={() => {}}
        onCreate={movement => navigate(toPath.depositNew(movement, id))}
      />
    </div>
  )
}
