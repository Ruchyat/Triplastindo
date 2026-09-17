import { cn, formatCurrency } from '@/lib'
import type { Tone } from '@/types'

type Props = {
  label: string
  /** Angka diformat sebagai mata uang ringkas; string ditampilkan apa adanya. */
  value: string | number
  hint?: string
  tone?: Exclude<Tone, 'slate'>
}

const tones = {
  blue: 'border-blue-200 bg-blue-50/50',
  green: 'border-emerald-200 bg-emerald-50/50',
  amber: 'border-amber-200 bg-amber-50/50',
  red: 'border-rose-200 bg-rose-50/50',
} as const

/** Kartu KPI ringkas untuk baris ringkasan di atas tabel. */
export function MiniStat({ label, value, hint, tone = 'blue' }: Props) {
  return (
    <div className={cn('rounded-xl border p-4', tones[tone])}>
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <p className="mt-1.5 text-lg font-bold tracking-tight text-slate-900">
        {typeof value === 'number' ? formatCurrency(value, true) : value}
      </p>
      {hint && <p className="mt-1 text-[10px] text-slate-500">{hint}</p>}
    </div>
  )
}
