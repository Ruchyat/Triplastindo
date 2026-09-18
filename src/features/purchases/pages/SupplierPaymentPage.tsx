import { useCallback, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { routePaths } from '@/app/router'
import { InfoNote, PageHeader } from '@/components/common'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib'
import type { ApiSupplierPayment } from '@/types'
import { SupplierPaymentDetailView } from '../components/payment-detail'

/** Halaman satu bukti pembayaran supplier. */
export function SupplierPaymentPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const paymentId = Number(id)

  const [payment, setPayment] = useState<ApiSupplierPayment | null>(null)
  const handleLoaded = useCallback((loaded: ApiSupplierPayment | null) => setPayment(loaded), [])

  if (!Number.isFinite(paymentId)) {
    return <InfoNote tone="red">Alamat bukti pembayaran tidak dikenali.</InfoNote>
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Transaksi / Pembelian"
        title={payment?.number ?? 'Memuat...'}
        description={
          payment ? `${formatDate(payment.date)} · ${payment.supplier?.name}` : undefined
        }
        actions={
          <Button variant="outline" onClick={() => navigate(routePaths.purchases)}>
            <ArrowLeft size={16} />
            Daftar Pembelian
          </Button>
        }
      />

      <SupplierPaymentDetailView paymentId={paymentId} onLoaded={handleLoaded} />
    </div>
  )
}
