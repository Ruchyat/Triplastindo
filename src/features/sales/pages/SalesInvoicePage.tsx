import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { routePaths, toPath } from '@/app/router'
import { InfoNote, PageHeader } from '@/components/common'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib'
import { InvoiceDetailView } from '../components/invoice-detail'
import { useInvoiceDetail } from '../useInvoiceDetail'

/**
 * Halaman satu invoice penjualan.
 *
 * Punya alamat sendiri, sehingga dapat ditautkan langsung dari Jurnal Umum
 * maupun kartu deposit tanpa menyaring daftar lebih dahulu.
 */
export function SalesInvoicePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const invoiceId = Number(id)

  const detail = useInvoiceDetail(invoiceId, () => {})
  const invoice = detail.invoice

  if (!Number.isFinite(invoiceId)) {
    return <InfoNote tone="red">Alamat invoice tidak dikenali.</InfoNote>
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Transaksi / Penjualan"
        title={invoice?.number ?? 'Memuat...'}
        description={
          invoice ? `${formatDate(invoice.date)} · ${invoice.customer?.name}` : undefined
        }
        actions={
          <Button variant="outline" onClick={() => navigate(routePaths.sales)}>
            <ArrowLeft size={16} />
            Daftar Invoice
          </Button>
        }
      />

      <InvoiceDetailView
        detail={detail}
        onDeleted={() => navigate(routePaths.sales, { replace: true })}
        onReceivePayment={target =>
          navigate(toPath.receiptNew({ customerId: target.customer?.id, invoiceId: target.id }))
        }
      />
    </div>
  )
}
