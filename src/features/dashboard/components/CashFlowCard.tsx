import { Banknote, Landmark } from 'lucide-react'
import { SectionHeader } from '@/components/common'
import { cn, formatCurrency, toAmount } from '@/lib'
import type { ApiDashboard } from '@/types'

type Props = {
  summary: ApiDashboard['cash_flow_ytd']
  year: number
}

/** Ringkasan arus kas YTD: saldo awal, uang masuk dan keluar, saldo akhir. */
export function CashFlowCard({ summary, year }: Props) {
  const items = [
    { label: 'Saldo Awal', value: toAmount(summary.opening), tone: 'bg-slate-100 text-slate-600' },
    { label: 'Uang Masuk', value: toAmount(summary.incoming), tone: 'bg-emerald-50 text-emerald-700' },
    { label: 'Uang Keluar', value: toAmount(summary.outgoing), tone: 'bg-amber-50 text-amber-700' },
    { label: 'Saldo Akhir', value: toAmount(summary.closing), tone: 'bg-blue-50 text-blue-700' },
  ]

  return (
    <article className="card p-5 md:p-6">
      <div className="flex items-start justify-between">
        <SectionHeader title="Ringkasan Arus Kas" subtitle={`Year to date ${year}`} />
        <Landmark size={20} className="text-blue-700" />
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {items.map(item => (
          <div
            key={item.label}
            className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4"
          >
            <div className={cn('grid size-9 place-items-center rounded-lg', item.tone)}>
              <Banknote size={17} />
            </div>
            <div>
              <p className="text-[11px] text-slate-500">{item.label}</p>
              <p className="mt-1 text-sm font-bold text-slate-900">
                {formatCurrency(item.value, true)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </article>
  )
}
