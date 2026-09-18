import { formatCurrency, formatDate, toAmount } from '@/lib'
import type { ApiSalesInvoice } from '@/types'

/** Nilai invoice: subtotal, pajak, total, uang diterima, dan sisanya. */
export function InvoiceValueSummary({ invoice }: { invoice: ApiSalesInvoice }) {
  const rows = [
    { label: 'Subtotal', value: invoice.subtotal },
    ...(toAmount(invoice.tax_amount) > 0 ? [{ label: 'PPN', value: invoice.tax_amount }] : []),
    { label: 'Total Invoice', value: invoice.total, strong: true },
    { label: 'Sudah Diterima', value: invoice.paid_amount },
    { label: 'Sisa Piutang', value: invoice.outstanding_amount, strong: true },
  ]

  return (
    <div className="rounded-xl border border-slate-200">
      {rows.map(row => (
        <div
          key={row.label}
          className="flex justify-between border-b border-slate-100 px-4 py-2.5 text-xs last:border-b-0"
        >
          <span className={row.strong ? 'font-semibold text-slate-700' : 'text-slate-500'}>
            {row.label}
          </span>
          <span
            className={
              row.strong
                ? 'font-bold tabular-nums text-slate-900'
                : 'tabular-nums text-slate-700'
            }
          >
            {formatCurrency(toAmount(row.value))}
          </span>
        </div>
      ))}
    </div>
  )
}

/** Keterangan pembayaran: metode, akun penerima, termin, dan jatuh tempo. */
export function InvoiceTermsSummary({ invoice }: { invoice: ApiSalesInvoice }) {
  const facts = [
    { label: 'Metode Pembayaran', value: invoice.settlement_method_label },
    { label: 'Akun Penerima', value: invoice.cash_account?.label ?? '–' },
    { label: 'Termin', value: invoice.term_days ? `${invoice.term_days} hari` : '–' },
    { label: 'Jatuh Tempo', value: invoice.due_date ? formatDate(invoice.due_date) : '–' },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 text-xs">
      {facts.map(fact => (
        <div key={fact.label}>
          <p className="text-slate-400">{fact.label}</p>
          <b className="text-slate-700">{fact.value}</b>
        </div>
      ))}
    </div>
  )
}
