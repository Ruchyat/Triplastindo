import { cn } from '@/lib'

export type LegendItem = {
  title: string
  description: string
  tone: 'blue' | 'amber' | 'green'
}

const tones = {
  blue: 'bg-blue-50 text-blue-900',
  amber: 'bg-amber-50 text-amber-900',
  green: 'bg-emerald-50 text-emerald-900',
} as const

/** Penjelasan singkat arti setiap kolom saldo pada halaman Customer / Supplier. */
export function BalanceLegend({ items }: { items: LegendItem[] }) {
  return (
    <div className="grid gap-3 p-5 text-xs text-slate-600 sm:grid-cols-3">
      {items.map(item => (
        <div key={item.title} className={cn('rounded-xl p-4', tones[item.tone])}>
          <b>{item.title}</b>
          <p className="mt-1 leading-5 text-slate-600">{item.description}</p>
        </div>
      ))}
    </div>
  )
}
