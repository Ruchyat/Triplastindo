import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toPath } from '@/app/router'
import { InfoNote, SectionHeader, Status } from '@/components/common'
import { JournalEntryCard } from '@/components/financial'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useAsync } from '@/hooks/useAsync'
import { formatCurrency, toAmount } from '@/lib'
import { ApiError } from '@/services/httpClient'
import { supplierPaymentService } from '@/services/supplierPaymentService'
import type { ApiSupplierPayment, ApiSupplierPaymentAllocation } from '@/types'

type Props = {
  paymentId: number
  /** Memberi tahu halaman identitas bukti yang dimuat, untuk kop halaman. */
  onLoaded: (payment: ApiSupplierPayment | null) => void
}

/**
 * Detail satu bukti pembayaran supplier.
 *
 * Membatalkannya membalik jurnalnya dan mengembalikan utang tagihan yang
 * tadinya berkurang — keduanya dikerjakan backend dalam satu transaksi.
 */
export function SupplierPaymentDetailView({ paymentId, onLoaded }: Props) {
  const load = useCallback(() => supplierPaymentService.show(paymentId), [paymentId])
  const { data: payment, error, reload } = useAsync(load)

  const [isWorking, setIsWorking] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)

  async function cancel() {
    setIsWorking(true)
    setActionError(null)

    try {
      await supplierPaymentService.cancel(paymentId)
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

  useEffect(() => onLoaded(payment), [payment, onLoaded])

  return (
    <div className="space-y-5">
      {error && <InfoNote tone="red">{error}</InfoNote>}
      {actionError && <InfoNote tone="red">{actionError}</InfoNote>}

      {payment && (
        <>
          <div className="flex items-center gap-2">
            <Status tone={payment.status === 'posted' ? 'green' : 'slate'}>
              {payment.status_label}
            </Status>
            <span className="text-sm font-bold text-slate-900">
              {formatCurrency(toAmount(payment.amount))}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <Fact label="Dibayar dari" value={payment.cash_account?.label ?? '–'} />
            <Fact label="No. Referensi" value={payment.reference ?? '–'} />
            <Fact label="Dibuat oleh" value={payment.created_by?.name ?? '–'} />
            <Fact label="Keterangan" value={payment.note ?? '–'} />
          </div>

          <SectionHeader
            title="Tagihan yang Dibayar"
            subtitle="Sisa utang menunjukkan posisi tagihan saat ini, bukan hanya akibat bukti ini."
          />
          <div className="overflow-hidden rounded-xl border border-slate-200">
            {(payment.allocations ?? []).map(allocation => (
              <AllocationRow key={allocation.id} allocation={allocation} />
            ))}
          </div>

          <SectionHeader title="Jurnal" />
          {payment.journal_entry && <JournalEntryCard entry={payment.journal_entry} />}

          {payment.status === 'cancelled' ? (
            <InfoNote tone="amber">
              Pembayaran ini sudah dibatalkan. Jurnalnya dibalik oleh jurnal tersendiri, dan sisa
              utang tagihan yang dibayarnya sudah dikembalikan.
            </InfoNote>
          ) : (
            <div className="border-t border-slate-200 pt-4">
              <Button
                variant="outline"
                className="w-full"
                disabled={isWorking}
                onClick={() => setIsConfirming(true)}
              >
                Batalkan Pembayaran
              </Button>
            </div>
          )}

          {isConfirming && (
            <ConfirmDialog
              title={`Batalkan pembayaran ${payment.number}?`}
              description={
                <>
                  <p>
                    Jurnal {payment.journal_entry?.number} akan dibalik, dan utang tagihan yang
                    dibayarnya kembali seperti semula:
                  </p>
                  <ul className="mt-2 list-inside list-disc space-y-0.5">
                    {(payment.allocations ?? []).map(allocation => (
                      <li key={allocation.id}>
                        {allocation.bill?.number} bertambah{' '}
                        <b>{formatCurrency(toAmount(allocation.amount))}</b>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2">Pembatalan tidak dapat diurungkan.</p>
                </>
              }
              confirmLabel="Batalkan Pembayaran"
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

/** Satu tagihan yang dibayar oleh bukti ini, beserta sisa utangnya kini. */
function AllocationRow({ allocation }: { allocation: ApiSupplierPaymentAllocation }) {
  const bill = allocation.bill
  const outstanding = toAmount(bill?.outstanding_amount)

  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-3 py-2.5 text-xs last:border-b-0">
      <div className="min-w-0">
        <Link
          to={toPath.purchaseBill(bill?.id ?? 0)}
          className="font-semibold text-blue-700 underline decoration-blue-200 underline-offset-2"
        >
          {bill?.number}
        </Link>
        <span className="mt-0.5 block text-[10px] text-slate-500">
          Total {formatCurrency(toAmount(bill?.total))} · Sisa utang {formatCurrency(outstanding)}
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
