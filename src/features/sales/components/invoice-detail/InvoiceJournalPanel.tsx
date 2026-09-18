import { Link } from 'react-router-dom'
import { routePaths } from '@/app/router/paths'
import { InfoNote } from '@/components/common'
import { formatCurrency, toAmount } from '@/lib'
import type { ApiSalesInvoice } from '@/types'

/**
 * Jurnal yang terbentuk dari invoice ini.
 *
 * Ditampilkan di sini supaya Finance dapat memeriksa hasil terjemahannya tanpa
 * berpindah ke Jurnal Umum. Nomor jurnalnya tetap menjadi tautan ke sana, bagi
 * yang ingin melihatnya berdampingan dengan transaksi lain.
 */
export function InvoiceJournalPanel({ invoice }: { invoice: ApiSalesInvoice }) {
  const entry = invoice.journal_entry

  if (!entry) {
    return (
      <InfoNote tone="amber">
        Invoice ini masih draft, jadi belum menghasilkan jurnal. Nilainya belum masuk laporan mana
        pun sampai diposting.
      </InfoNote>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-3 py-2">
        <Link
          to={`${routePaths.journals}?search=${encodeURIComponent(entry.number)}&month=${entry.date.slice(0, 7)}`}
          className="text-xs font-bold text-blue-700 underline decoration-blue-200 underline-offset-2"
        >
          {entry.number}
        </Link>
        <span className="text-[10px] font-bold uppercase text-slate-500">{entry.tagging_label}</span>
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
