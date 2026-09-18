import { NumberInput } from '@/components/common'
import { cn, formatCurrency, formatDate, toAmount } from '@/lib'
import type { ApiSalesInvoice } from '@/types'
import type { ReceiptForm } from './useReceiptForm'

type Props = {
  invoices: ApiSalesInvoice[]
  form: ReceiptForm
}

/**
 * Invoice customer yang masih menyisakan piutang.
 *
 * Mencentang sebuah invoice mengisi nilainya penuh sesuai sisa piutang, karena
 * itulah kasus yang paling sering; nilainya tetap dapat diubah bila customer
 * membayar sebagian.
 */
export function OutstandingInvoiceList({ invoices, form }: Props) {
  if (invoices.length === 0) {
    return (
      <p className="rounded-xl border border-slate-200 p-4 text-xs text-slate-500">
        Customer ini tidak memiliki invoice yang menunggu pembayaran.
      </p>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="grid grid-cols-[1fr_130px_160px] gap-2 bg-slate-50 px-3 py-2.5 text-[10px] font-bold uppercase text-slate-500">
        <span>Invoice</span>
        <span className="text-right">Sisa Piutang</span>
        <span className="text-right">Dibayar</span>
      </div>

      {invoices.map(invoice => {
        const isChecked = toAmount(form.amounts[invoice.id]) > 0
        const over = form.isOver(invoice)

        return (
          <div
            key={invoice.id}
            className="grid grid-cols-[1fr_130px_160px] items-center gap-2 border-t border-slate-100 p-3"
          >
            <label className="flex min-w-0 items-center gap-2">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => form.toggle(invoice)}
                className="size-4 shrink-0"
              />
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold text-slate-800">
                  {invoice.number}
                </span>
                <span className="block text-[10px] text-slate-500">
                  {formatDate(invoice.date)}
                  {invoice.due_date && ` · jatuh tempo ${formatDate(invoice.due_date)}`}
                </span>
              </span>
            </label>

            <span className="text-right text-xs tabular-nums text-slate-600">
              {formatCurrency(toAmount(invoice.outstanding_amount))}
            </span>

            <NumberInput
              prefix="Rp"
              placeholder="0"
              value={form.amounts[invoice.id] ?? ''}
              onChange={value => form.setAmount(invoice.id, value)}
              className={cn(over && 'border-rose-400 text-rose-700')}
            />
          </div>
        )
      })}
    </div>
  )
}
