import { formatCurrency, formatDate } from '@/lib'
import type { SaleInvoiceForm } from './useSaleInvoiceForm'

/**
 * Ringkasan nilai invoice sebelum disimpan.
 *
 * Angka di sini dihitung di browser hanya untuk ditampilkan. Nilai yang
 * tersimpan adalah hasil hitungan backend, dari kuantitas dan harga yang
 * dikirim form ini.
 *
 * Pada penjualan tunai, "Diterima Sekarang" bisa nol — yaitu ketika saldo
 * deposit menutup seluruh invoice dan tidak ada uang yang berpindah.
 */
export function InvoiceTotals({ form }: { form: SaleInvoiceForm }) {
  const totals = form.isDeferred
    ? [
        { label: 'Total Invoice', value: form.total },
        { label: 'DP + Deposit', value: form.paidNow + form.appliedDeposit },
        { label: 'Sisa Piutang', value: form.receivable },
      ]
    : [
        { label: 'Total Invoice', value: form.total },
        { label: 'Dipotong Deposit', value: form.appliedDeposit },
        { label: 'Diterima Sekarang', value: form.receivedNow },
      ]

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-3 rounded-lg bg-slate-900 p-3 text-white">
        {totals.map(total => (
          <div key={total.label}>
            <p className="text-[9px] text-slate-400">{total.label}</p>
            <b className="text-xs">{formatCurrency(total.value)}</b>
          </div>
        ))}
      </div>

      {form.isDeferred && form.dueDate && (
        <p className="text-[11px] text-slate-500">
          Jatuh tempo <b>{formatDate(form.dueDate)}</b>, {form.termDays} hari sejak tanggal invoice.
        </p>
      )}
    </div>
  )
}
