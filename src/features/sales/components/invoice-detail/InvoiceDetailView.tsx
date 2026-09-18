import { useState } from 'react'
import { InfoNote, SectionHeader, Status } from '@/components/common'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { formatCurrency, formatDate, toAmount } from '@/lib'
import { documentStatusTone, type ApiSalesInvoice } from '@/types'
import { useInvoiceDetail } from '../../useInvoiceDetail'
import { InvoiceItemsList } from './InvoiceItemsList'
import { InvoiceJournalPanel } from './InvoiceJournalPanel'
import { InvoicePaymentHistory } from './InvoicePaymentHistory'
import { InvoiceTermsSummary, InvoiceValueSummary } from './InvoiceValueSummary'

type Props = {
  /**
   * Hasil pemuatan invoice.
   *
   * Hook-nya dipanggil di halaman, bukan di sini, karena kop halaman juga
   * memerlukan nomor dan customernya. Menyalurkannya ke atas lewat callback
   * berarti memperbarui state induk saat anak sedang dirender.
   */
  detail: ReturnType<typeof useInvoiceDetail>
  /** Dipanggil setelah invoice dihapus, agar halaman berpindah. */
  onDeleted: () => void
  /** Membuka form penerimaan pembayaran untuk invoice ini. */
  onReceivePayment: (invoice: ApiSalesInvoice) => void
}

/**
 * Detail satu invoice penjualan beserta tindakan yang dapat dikenakan padanya.
 *
 * Halaman penuh dengan alamat sendiri, sehingga sebuah invoice dapat ditautkan
 * langsung dari Jurnal Umum maupun kartu deposit — tanpa menyaring daftar
 * lebih dahulu.
 */
export function InvoiceDetailView({ detail, onDeleted, onReceivePayment }: Props) {
  const invoice = detail.invoice

  return (
    <div className="space-y-5">
      {detail.error && <InfoNote tone="red">{detail.error}</InfoNote>}

      {detail.isLoading && !invoice && <p className="text-xs text-slate-500">Memuat invoice...</p>}

      {invoice && (
        <>
          <div className="flex items-center gap-2">
            <Status tone={documentStatusTone[invoice.display_status]}>
              {invoice.display_status_label}
            </Status>
            {invoice.note && <span className="text-xs text-slate-500">{invoice.note}</span>}
          </div>

          <InvoiceTermsSummary invoice={invoice} />

          <SectionHeader title="Produk" />
          <InvoiceItemsList invoice={invoice} />

          <SectionHeader title="Nilai" />
          <InvoiceValueSummary invoice={invoice} />

          <SectionHeader title="Pembayaran Diterima" subtitle="Deposit yang dipotong dan bukti penerimaan yang mengurangi piutang invoice ini." />
          <InvoicePaymentHistory invoice={invoice} />

          <SectionHeader title="Jurnal" />
          <InvoiceJournalPanel invoice={invoice} />

          <p className="text-[11px] text-slate-400">
            Dibuat oleh {invoice.created_by?.name ?? '–'}
            {invoice.created_at && ` · ${formatDate(invoice.created_at)}`}
          </p>

          <InvoiceActions
            invoice={invoice}
            detail={detail}
            onDeleted={onDeleted}
            onReceivePayment={() => onReceivePayment(invoice)}
          />
        </>
      )}
    </div>
  )
}

type ActionsProps = {
  invoice: ApiSalesInvoice
  detail: ReturnType<typeof useInvoiceDetail>
  onDeleted: () => void
  onReceivePayment: () => void
}

/**
 * Tindakan yang tersedia, mengikuti status dokumen.
 *
 * Invoice yang sudah diposting tidak dapat dihapus — jurnalnya sudah terbaca
 * laporan — dan yang benar adalah membatalkannya, yang membentuk jurnal
 * pembalik. Backend menolak bila aturan ini dilanggar; tombolnya disembunyikan
 * agar pengguna tidak mencoba sesuatu yang pasti ditolak.
 *
 * Invoice yang sudah menerima pembayaran pun tetap menampilkan tombol Batalkan,
 * tetapi backend menolaknya: penerimaannya harus dibatalkan lebih dahulu, agar
 * tidak ada uang masuk yang kehilangan dokumen penjelasnya.
 */
function InvoiceActions({ invoice, detail, onDeleted, onReceivePayment }: ActionsProps) {
  const [confirming, setConfirming] = useState<'cancel' | 'delete' | null>(null)

  const isDraft = invoice.status === 'draft'
  const isCancelled = invoice.status === 'cancelled'
  const isOutstanding = invoice.status === 'unpaid' || invoice.status === 'partial'
  const depositUsed = (invoice.deposit_applications ?? []).reduce(
    (total, deposit) => total + toAmount(deposit.amount),
    0,
  )

  if (isCancelled) {
    return (
      <InfoNote tone="amber">
        Invoice ini sudah dibatalkan. Jurnalnya tidak dihapus, melainkan dibalik oleh jurnal
        tersendiri agar jejaknya tetap dapat ditelusuri.
      </InfoNote>
    )
  }

  return (
    <>
      <div className="flex gap-2 border-t border-slate-200 pt-4">
        {isDraft ? (
          <>
            <Button
              variant="outline"
              className="flex-1"
              disabled={detail.isWorking}
              onClick={() => setConfirming('delete')}
            >
              Hapus Draft
            </Button>
            <Button
              className="flex-1"
              disabled={detail.isWorking}
              onClick={() => void detail.post()}
            >
              {detail.isWorking ? 'Memproses...' : 'Posting Invoice'}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              className="flex-1"
              disabled={detail.isWorking}
              onClick={() => setConfirming('cancel')}
            >
              Batalkan Invoice
            </Button>
            {isOutstanding && (
              <Button className="flex-1" onClick={onReceivePayment}>
                Terima Pembayaran
              </Button>
            )}
          </>
        )}
      </div>

      {confirming === 'delete' && (
        <ConfirmDialog
          title={`Hapus draft ${invoice.number}?`}
          description="Draft ini belum menghasilkan jurnal, jadi tidak ada angka laporan yang berubah. Dokumennya sendiri tidak dapat dikembalikan."
          confirmLabel="Hapus Draft"
          isWorking={detail.isWorking}
          error={detail.actionError}
          onCancel={() => setConfirming(null)}
          onConfirm={async () => {
            if (await detail.remove()) onDeleted()
          }}
        />
      )}

      {confirming === 'cancel' && (
        <ConfirmDialog
          title={`Batalkan invoice ${invoice.number}?`}
          description={
            <>
              <p>
                Jurnal {invoice.journal_entry?.number} akan dibalik oleh jurnal pembalik — bukan
                dihapus, sehingga jejaknya tetap dapat ditelusuri.
              </p>
              <ul className="mt-2 list-inside list-disc space-y-0.5">
                <li>
                  Piutang {invoice.customer?.name} berkurang{' '}
                  <b>{formatCurrency(toAmount(invoice.outstanding_amount))}</b>
                </li>
                {depositUsed > 0 && (
                  <li>
                    Saldo deposit <b>{formatCurrency(depositUsed)}</b> kembali tersedia
                  </li>
                )}
              </ul>
              <p className="mt-2">Pembatalan tidak dapat diurungkan.</p>
            </>
          }
          confirmLabel="Batalkan Invoice"
          cancelLabel="Jangan Batalkan"
          isWorking={detail.isWorking}
          error={detail.actionError}
          onCancel={() => setConfirming(null)}
          onConfirm={async () => {
            if (await detail.cancel()) setConfirming(null)
          }}
        />
      )}
    </>
  )
}
