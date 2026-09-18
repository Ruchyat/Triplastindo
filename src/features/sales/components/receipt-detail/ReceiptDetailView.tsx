import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { routePaths, toPath } from '@/app/router'
import { InfoNote, SectionHeader, Status } from '@/components/common'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useAsync } from '@/hooks/useAsync'
import { formatCurrency, toAmount } from '@/lib'
import { ApiError } from '@/services/httpClient'
import { receiptService } from '@/services/receiptService'
import type { ApiPaymentAllocation, ApiPaymentReceipt } from '@/types'

type Props = {
  receiptId: number
  /** Memberi tahu halaman identitas bukti yang dimuat, untuk kop halaman. */
  onLoaded: (receipt: ApiPaymentReceipt | null) => void
}

/**
 * Detail satu bukti penerimaan pembayaran.
 *
 * Membatalkannya membalik jurnalnya dan mengembalikan piutang invoice yang
 * tadinya berkurang — keduanya dikerjakan backend dalam satu transaksi.
 */
export function ReceiptDetailView({ receiptId, onLoaded }: Props) {
  const load = useCallback(() => receiptService.show(receiptId), [receiptId])
  const { data: receipt, error, reload } = useAsync(load)

  const [isWorking, setIsWorking] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)

  async function cancel() {
    setIsWorking(true)
    setActionError(null)

    try {
      await receiptService.cancel(receiptId)
      reload()
      setIsConfirming(false)
    } catch (failure) {
      setActionError(
        failure instanceof ApiError ? failure.message : 'Pembatalan gagal dijalankan.',
      )
    } finally {
      setIsWorking(false)
    }
  }

  useEffect(() => onLoaded(receipt), [receipt, onLoaded])

  return (
    <div className="space-y-5">
      {error && <InfoNote tone="red">{error}</InfoNote>}
      {actionError && <InfoNote tone="red">{actionError}</InfoNote>}

      {receipt && (
        <>
          <div className="flex items-center gap-2">
            <Status tone={receipt.status === 'posted' ? 'green' : 'slate'}>
              {receipt.status_label}
            </Status>
            <span className="text-sm font-bold text-slate-900">
              {formatCurrency(toAmount(receipt.amount))}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <Fact label="Diterima di" value={receipt.cash_account?.label ?? '–'} />
            <Fact label="No. Referensi" value={receipt.reference ?? '–'} />
            <Fact label="Dibuat oleh" value={receipt.created_by?.name ?? '–'} />
            <Fact label="Keterangan" value={receipt.note ?? '–'} />
          </div>

          <SectionHeader
            title="Invoice yang Dibayar"
            subtitle="Sisa piutang menunjukkan posisi invoice saat ini, bukan hanya akibat bukti ini."
          />
          <div className="overflow-hidden rounded-xl border border-slate-200">
            {(receipt.allocations ?? []).map(allocation => (
              <AllocationRow key={allocation.id} allocation={allocation} />
            ))}
          </div>

          <SectionHeader title="Jurnal" />
          <ReceiptJournal receipt={receipt} />

          {receipt.status === 'cancelled' ? (
            <InfoNote tone="amber">
              Penerimaan ini sudah dibatalkan. Jurnalnya dibalik oleh jurnal tersendiri, dan sisa
              piutang invoice yang dibayarnya sudah dikembalikan.
            </InfoNote>
          ) : (
            <div className="border-t border-slate-200 pt-4">
              <Button
                variant="outline"
                className="w-full"
                disabled={isWorking}
                onClick={() => setIsConfirming(true)}
              >
                Batalkan Penerimaan
              </Button>
            </div>
          )}

          {isConfirming && (
            <ConfirmDialog
              title={`Batalkan penerimaan ${receipt.number}?`}
              description={
                <>
                  <p>
                    Jurnal {receipt.journal_entry?.number} akan dibalik, dan piutang invoice yang
                    dibayarnya kembali seperti semula:
                  </p>
                  <ul className="mt-2 list-inside list-disc space-y-0.5">
                    {(receipt.allocations ?? []).map(allocation => (
                      <li key={allocation.id}>
                        {allocation.invoice?.number} bertambah{' '}
                        <b>{formatCurrency(toAmount(allocation.amount))}</b>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2">Pembatalan tidak dapat diurungkan.</p>
                </>
              }
              confirmLabel="Batalkan Penerimaan"
              cancelLabel="Jangan Batalkan"
              isWorking={isWorking}
              error={actionError}
              onCancel={() => setIsConfirming(false)}
              onConfirm={() => void cancel()}
            />
          )}
        </>
      )}
    </div>
  )
}

/**
 * Satu invoice yang dibayar oleh bukti ini.
 *
 * Nilai yang dibayar dan sisa piutangnya ditampilkan berdampingan. Menyebut
 * baris ini "dilunasi" tanpa menyebut sisanya menyesatkan: sebagian besar
 * penerimaan justru bersifat sebagian. Status lunas ditampilkan sebagai
 * penanda tambahan, bukan sebagai judul.
 */
function AllocationRow({ allocation }: { allocation: ApiPaymentAllocation }) {
  const invoice = allocation.invoice
  const outstanding = toAmount(invoice?.outstanding_amount)

  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-3 py-2.5 text-xs last:border-b-0">
      <div className="min-w-0">
        <Link
          to={toPath.salesInvoice(invoice?.id ?? 0)}
          className="font-semibold text-blue-700 underline decoration-blue-200 underline-offset-2"
        >
          {invoice?.number}
        </Link>
        <span className="mt-0.5 block text-[10px] text-slate-500">
          Total {formatCurrency(toAmount(invoice?.total))} · Sisa piutang{' '}
          {formatCurrency(outstanding)}
        </span>
      </div>

      <div className="shrink-0 text-right">
        <span className="block font-semibold tabular-nums text-slate-900">
          {formatCurrency(toAmount(allocation.amount))}
        </span>
        <span className="mt-0.5 block">
          {outstanding === 0 ? (
            <Status tone="green">Lunas</Status>
          ) : (
            <span className="text-[10px] text-amber-700">belum lunas</span>
          )}
        </span>
      </div>
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-slate-400">{label}</p>
      <b className="text-slate-700">{value}</b>
    </div>
  )
}

function ReceiptJournal({ receipt }: { receipt: ApiPaymentReceipt }) {
  const entry = receipt.journal_entry
  if (!entry) return null

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="border-b border-slate-100 bg-slate-50 px-3 py-2">
        <Link
          to={`${routePaths.journals}?search=${encodeURIComponent(entry.number)}&month=${entry.date.slice(0, 7)}`}
          className="text-xs font-bold text-blue-700 underline decoration-blue-200 underline-offset-2"
        >
          {entry.number}
        </Link>
      </div>
      <table className="w-full text-xs">
        <tbody>
          {(entry.lines ?? []).map(line => {
            const isDebit = toAmount(line.debit) > 0
            return (
              <tr key={line.id} className="border-b border-slate-100 last:border-b-0">
                <td className="w-6 px-3 py-2 font-bold text-slate-400">{isDebit ? 'D' : 'K'}</td>
                <td className="py-2 pr-3">
                  <span className="font-semibold text-slate-700">{line.account?.code}</span>
                  <span className="text-slate-500"> · {line.account?.name}</span>
                </td>
                <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-900">
                  {formatCurrency(toAmount(isDebit ? line.debit : line.credit))}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
