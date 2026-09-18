import { Link } from 'react-router-dom'
import { routePaths } from '@/app/router'
import { formatCurrency, toAmount } from '@/lib'
import type { ApiJournalEntry } from '@/types'

/**
 * Jurnal yang dilahirkan sebuah dokumen, beserta tautan ke Jurnal Umum.
 *
 * Dipakai di detail invoice, tagihan, penerimaan, dan pembayaran — bentuknya
 * sama di mana pun agar pembaca tidak perlu belajar ulang tiap dokumen.
 */
export function JournalEntryCard({ entry }: { entry: ApiJournalEntry }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-3 py-2">
        <Link
          to={`${routePaths.journals}?search=${encodeURIComponent(entry.number)}&month=${entry.date.slice(0, 7)}`}
          className="text-xs font-bold text-blue-700 underline decoration-blue-200 underline-offset-2"
        >
          {entry.number}
        </Link>
        {entry.tagging_label && (
          <span className="text-[10px] font-bold uppercase text-slate-500">{entry.tagging_label}</span>
        )}
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
