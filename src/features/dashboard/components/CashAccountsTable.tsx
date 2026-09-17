import { SectionHeader } from '@/components/common'
import { formatCurrency, formatRatioPercent } from '@/lib'
import { activePeriod } from '@/mocks/session'
import { cashAccounts, totalCashBalance } from '@/mocks/dashboard'
import { formatDate } from '@/lib'

/** Saldo setiap akun kas dan bank beserta proporsinya terhadap total. */
export function CashAccountsTable() {
  return (
    <article className="card overflow-hidden">
      <div className="flex items-start justify-between p-5 md:p-6">
        <SectionHeader
          title="Saldo Kas & Bank"
          subtitle={`Posisi saldo per ${formatDate(activePeriod.asOf)}`}
        />
        <button className="text-xs font-semibold text-blue-700">Lihat buku besar</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-left">
          <thead>
            <tr className="border-y border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
              <th className="px-6 py-3 font-semibold">Akun</th>
              <th className="px-6 py-3 font-semibold">Jenis</th>
              <th className="px-6 py-3 text-right font-semibold">Saldo</th>
              <th className="px-6 py-3 text-right font-semibold">Proporsi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cashAccounts.map(account => (
              <tr key={account.name} className="text-sm hover:bg-slate-50">
                <td className="px-6 py-3.5 font-semibold text-slate-800">{account.name}</td>
                <td className="px-6 py-3.5">
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600">
                    {account.type}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-right font-semibold tabular-nums text-slate-900">
                  {formatCurrency(account.balance)}
                </td>
                <td className="px-6 py-3.5 text-right text-xs text-slate-500">
                  {formatRatioPercent(account.balance, totalCashBalance)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-blue-50/60 text-sm font-bold">
              <td className="px-6 py-4 text-slate-900" colSpan={2}>
                Total Saldo Kas &amp; Bank
              </td>
              <td className="px-6 py-4 text-right tabular-nums text-blue-800">
                {formatCurrency(totalCashBalance)}
              </td>
              <td className="px-6 py-4 text-right text-blue-800">100,0%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </article>
  )
}
