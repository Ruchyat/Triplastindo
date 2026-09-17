import { ArrowRight } from 'lucide-react'
import { SectionHeader } from '@/components/common'
import { cn } from '@/lib'
import { dashboardRatios } from '@/mocks/dashboard'

/** Ringkasan rasio keuangan YTD terhadap standar perusahaan. */
export function RatioCard() {
  return (
    <article className="card p-5 md:p-6">
      <SectionHeader title="Rasio Keuangan YTD" subtitle="Dibandingkan dengan standar perusahaan" />

      <div className="mt-5 divide-y divide-slate-100">
        {dashboardRatios.map(ratio => (
          <div key={ratio.short} className="flex items-center gap-3 py-3.5 first:pt-0">
            <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-[10px] font-bold text-slate-600">
              {ratio.short}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-700">{ratio.name}</p>
              <p className="mt-0.5 text-[10px] text-slate-400">Standar perusahaan</p>
            </div>
            <p className="text-sm font-bold tabular-nums text-slate-900">{ratio.value}</p>
            <span
              className={cn(
                'min-w-[48px] rounded-full px-2 py-1 text-center text-[10px] font-bold',
                ratio.good ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700',
              )}
            >
              {ratio.good ? 'Good' : 'Bad'}
            </span>
          </div>
        ))}
      </div>

      <button className="mt-3 flex items-center gap-1 text-xs font-semibold text-blue-700">
        Lihat analisis rasio <ArrowRight size={13} />
      </button>
    </article>
  )
}
