import { useState } from 'react'
import { SectionHeader } from '@/components/common'
import { FinancialTrendChart, type TrendMode } from '@/components/charts/FinancialTrendChart'
import { cn } from '@/lib'

const modes: { value: TrendMode; label: string }[] = [
  { value: 'revenue', label: 'Pendapatan & Beban' },
  { value: 'profit', label: 'Laba Bersih' },
]

const legends: Record<TrendMode, { color: string; label: string }[]> = {
  revenue: [
    { color: 'bg-blue-600', label: 'Pendapatan' },
    { color: 'bg-amber-500', label: 'Pengeluaran' },
  ],
  profit: [{ color: 'bg-emerald-600', label: 'Laba Bersih' }],
}

/** Grafik kinerja keuangan bulanan dengan pilihan tampilan. */
export function TrendCard() {
  const [mode, setMode] = useState<TrendMode>('revenue')

  return (
    <article className="card min-w-0 p-5 md:p-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <SectionHeader
          title="Overview Keuangan Full Year"
          subtitle="Kinerja bulanan dalam juta Rupiah"
        />
        <div className="flex rounded-lg bg-slate-100 p-1 text-xs font-semibold">
          {modes.map(option => (
            <button
              key={option.value}
              onClick={() => setMode(option.value)}
              className={cn(
                'rounded-md px-3 py-1.5 transition',
                mode === option.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 h-[285px] w-full">
        <FinancialTrendChart mode={mode} />
      </div>

      <div className="mt-3 flex gap-5 border-t border-slate-100 pt-4 text-xs">
        {legends[mode].map(legend => (
          <span key={legend.label} className="flex items-center gap-2 text-slate-600">
            <i className={cn('size-2.5 rounded-full', legend.color)} />
            {legend.label}
          </span>
        ))}
      </div>
    </article>
  )
}
