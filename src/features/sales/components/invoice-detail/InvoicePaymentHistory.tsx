import { formatCurrency, formatDate, toAmount } from '@/lib'
import type { ApiSalesInvoice } from '@/types'

/**
 * Riwayat pembayaran invoice: saldo deposit yang dipotong dan bukti penerimaan
 * mana saja yang menguranginya.
 *
 * Disebut "pembayaran diterima", bukan "pelunasan": sebagian besar penerimaan
 * bersifat sebagian, dan sisa piutangnya ada pada ringkasan nilai di atas.
 *
 * Yang sudah dibatalkan tetap ditampilkan dan diberi coretan, bukan
 * disembunyikan — pembatalan adalah kejadian yang perlu ikut terbaca saat
 * menelusuri kenapa sisa piutangnya berubah.
 */
export function InvoicePaymentHistory({ invoice }: { invoice: ApiSalesInvoice }) {
  const allocations = invoice.allocations ?? []
  const deposits = invoice.deposit_applications ?? []

  if (allocations.length === 0 && deposits.length === 0) {
    return (
      <p className="rounded-xl border border-slate-200 p-4 text-xs text-slate-500">
        Belum ada deposit yang dipotong maupun pembayaran yang diterima atas invoice ini.
      </p>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      {deposits.map(deposit => (
        <Row
          key={`dep-${deposit.id}`}
          title={deposit.number}
          subtitle={`${formatDate(deposit.date)} · dipotong dari saldo deposit`}
          amount={deposit.amount}
          isCancelled={deposit.status === 'cancelled'}
        />
      ))}

      {allocations.map(allocation => {
        const receipt = allocation.receipt
        const isCancelled = receipt?.status === 'cancelled'

        return (
          <Row
            key={allocation.id}
            title={receipt?.number ?? '–'}
            subtitle={[
              receipt && formatDate(receipt.date),
              receipt?.cash_account?.name,
              receipt?.reference,
            ]
              .filter(Boolean)
              .join(' · ')}
            amount={allocation.amount}
            isCancelled={isCancelled}
          />
        )
      })}
    </div>
  )
}

type RowProps = {
  title: string
  subtitle: string
  amount: string
  isCancelled: boolean
}

function Row({ title, subtitle, amount, isCancelled }: RowProps) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5 text-xs last:border-b-0">
      <div className="min-w-0">
        <span
          className={
            isCancelled ? 'font-semibold text-slate-400 line-through' : 'font-semibold text-slate-800'
          }
        >
          {title}
        </span>
        <span className="block text-[10px] text-slate-500">
          {subtitle}
          {isCancelled && ' · dibatalkan'}
        </span>
      </div>
      <span
        className={
          isCancelled
            ? 'tabular-nums text-slate-400 line-through'
            : 'font-semibold tabular-nums text-slate-900'
        }
      >
        {formatCurrency(toAmount(amount))}
      </span>
    </div>
  )
}
