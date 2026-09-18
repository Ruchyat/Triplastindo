import { formatCurrency, formatNumber, toAmount } from '@/lib'
import type { ApiSalesInvoice } from '@/types'

/** Baris produk pada invoice. */
export function InvoiceItemsList({ invoice }: { invoice: ApiSalesInvoice }) {
  const items = invoice.items ?? []

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
            <th className="px-3 py-2 text-left">Produk</th>
            <th className="px-3 py-2 text-right">Qty</th>
            <th className="px-3 py-2 text-right">Harga</th>
            <th className="px-3 py-2 text-right">Jumlah</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id} className="border-t border-slate-100">
              <td className="px-3 py-2 font-medium text-slate-800">
                {item.product?.name}
                {/* Akun pendapatan ikut ditampilkan supaya terlihat ke mana
                    nilai baris ini bermuara, tanpa membuka Jurnal Umum. */}
                {item.product?.revenue_account && (
                  <span className="block text-[10px] text-slate-400">
                    {item.product.revenue_account.label}
                  </span>
                )}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {formatNumber(toAmount(item.quantity))} {item.product?.unit}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {formatCurrency(toAmount(item.unit_price))}
              </td>
              <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-900">
                {formatCurrency(toAmount(item.amount))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
