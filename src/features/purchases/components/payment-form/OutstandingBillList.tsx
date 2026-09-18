import { NumberInput } from '@/components/common'
import { cn, formatCurrency, formatDate, toAmount } from '@/lib'
import type { ApiPurchaseBill } from '@/types'
import type { SupplierPaymentForm } from './useSupplierPaymentForm'

type Props = {
  bills: ApiPurchaseBill[]
  form: SupplierPaymentForm
}

/**
 * Tagihan supplier yang masih menyisakan utang.
 *
 * Mencentang sebuah tagihan mengisi nilainya penuh sesuai sisa utang, karena
 * itulah kasus yang paling sering; nilainya tetap dapat diubah bila dibayar
 * sebagian.
 */
export function OutstandingBillList({ bills, form }: Props) {
  if (bills.length === 0) {
    return (
      <p className="rounded-xl border border-slate-200 p-4 text-xs text-slate-500">
        Supplier ini tidak memiliki tagihan yang menunggu pembayaran.
      </p>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="grid grid-cols-[1fr_130px_160px] gap-2 bg-slate-50 px-3 py-2.5 text-[10px] font-bold uppercase text-slate-500">
        <span>Tagihan</span>
        <span className="text-right">Sisa Utang</span>
        <span className="text-right">Dibayar</span>
      </div>

      {bills.map(bill => {
        const isChecked = toAmount(form.amounts[bill.id]) > 0
        const over = form.isOver(bill)

        return (
          <div
            key={bill.id}
            className="grid grid-cols-[1fr_130px_160px] items-center gap-2 border-t border-slate-100 p-3"
          >
            <label className="flex min-w-0 items-center gap-2">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => form.toggle(bill)}
                className="size-4 shrink-0"
              />
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold text-slate-800">
                  {bill.number}
                  {bill.supplier_invoice_number && (
                    <span className="font-normal text-slate-500"> · {bill.supplier_invoice_number}</span>
                  )}
                </span>
                <span className="block text-[10px] text-slate-500">
                  {formatDate(bill.date)} · {bill.category_label}
                  {bill.due_date && ` · jatuh tempo ${formatDate(bill.due_date)}`}
                </span>
              </span>
            </label>

            <span className="text-right text-xs tabular-nums text-slate-600">
              {formatCurrency(toAmount(bill.outstanding_amount))}
            </span>

            <NumberInput
              prefix="Rp"
              placeholder="0"
              value={form.amounts[bill.id] ?? ''}
              onChange={value => form.setAmount(bill.id, value)}
              className={cn(over && 'border-rose-400 text-rose-700')}
            />
          </div>
        )
      })}
    </div>
  )
}
