import { useCallback, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { routePaths } from '@/app/router'
import { InfoNote, PageHeader } from '@/components/common'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib'
import type { ApiPaymentReceipt } from '@/types'
import { ReceiptDetailView } from '../components/receipt-detail'

/** Halaman satu bukti penerimaan pembayaran. */
export function ReceiptPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const receiptId = Number(id)

  const [receipt, setReceipt] = useState<ApiPaymentReceipt | null>(null)
  const handleLoaded = useCallback((loaded: ApiPaymentReceipt | null) => setReceipt(loaded), [])

  if (!Number.isFinite(receiptId)) {
    return <InfoNote tone="red">Alamat bukti penerimaan tidak dikenali.</InfoNote>
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Transaksi / Penjualan"
        title={receipt?.number ?? 'Memuat...'}
        description={
          receipt ? `${formatDate(receipt.date)} · ${receipt.customer?.name}` : undefined
        }
        actions={
          <Button variant="outline" onClick={() => navigate(routePaths.sales)}>
            <ArrowLeft size={16} />
            Daftar Penjualan
          </Button>
        }
      />

      <ReceiptDetailView receiptId={receiptId} onLoaded={handleLoaded} />
    </div>
  )
}
