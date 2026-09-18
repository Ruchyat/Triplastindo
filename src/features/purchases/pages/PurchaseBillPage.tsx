import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { routePaths } from '@/app/router'
import { PageHeader } from '@/components/common'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib'
import { PurchaseBillDetailView } from '../components/bill-detail'
import { usePurchaseBillDetail } from '../usePurchaseBillDetail'

/** Halaman satu tagihan pembelian. */
export function PurchaseBillPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const detail = usePurchaseBillDetail(Number(id))
  const bill = detail.bill

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Transaksi / Pembelian"
        title={bill?.number ?? 'Memuat...'}
        description={bill ? `${formatDate(bill.date)} · ${bill.supplier?.name}` : undefined}
        actions={
          <Button variant="outline" onClick={() => navigate(routePaths.purchases)}>
            <ArrowLeft size={16} />
            Daftar Tagihan
          </Button>
        }
      />

      <PurchaseBillDetailView
        detail={detail}
        onDeleted={() => navigate(routePaths.purchases, { replace: true })}
      />
    </div>
  )
}
