import type { LucideIcon } from 'lucide-react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { cn, formatCurrency, formatPercent } from '@/lib'

type Props = {
  title: string
  value: number
  meta: string
  /** Perubahan terhadap periode sebelumnya sebagai pecahan, misalnya `0.076`. */
  change?: number
  icon: LucideIcon
  tone: 'blue' | 'amber' | 'emerald' | 'cyan'
}

const tones = {
  blue: 'bg-blue-50 text-blue-700',
  amber: 'bg-amber-50 text-amber-700',
  emerald: 'bg-emerald-50 text-emerald-700',
  cyan: 'bg-cyan-50 text-cyan-700',
} as const

/** Kartu KPI utama Dashboard dengan indikator naik atau turun. */
export function StatCard({ title, value, meta, change, icon: Icon, tone }: Props) {
  const positive = (change ?? 0) >= 0
  return (
    <article className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className={cn('grid size-10 place-items-center rounded-xl', tones[tone])}>
          <Icon size={19} />
        </div>
        {change !== undefined && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-xs font-semibold',
              positive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700',
            )}
          >
            {positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {formatPercent(Math.abs(change))}
          </span>
        )}
      </div>
      <p className="mt-5 text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-1 text-[1.55rem] font-bold tracking-tight text-slate-950">
        {formatCurrency(value, true)}
      </p>
      <p className="mt-2 text-xs text-slate-500">{meta}</p>
    </article>
  )
}
