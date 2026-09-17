import { CalendarDays } from 'lucide-react'
import { cn } from '@/lib'
import { periodOptions } from '@/mocks/dashboard'
import type { PeriodKey } from '@/types'

type Props = {
  value: PeriodKey
  onChange: (period: PeriodKey) => void
}

/** Pemilih periode Dashboard: bulan tertentu atau akumulasi YTD. */
export function PeriodSelect({ value, onChange }: Props) {
  return (
    <div className="relative">
      <CalendarDays
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
      <select
        aria-label="Pilih periode"
        value={value}
        onChange={event => onChange(event.target.value as PeriodKey)}
        className={cn(
          'h-10 appearance-none rounded-lg border border-slate-200 bg-white py-0 pl-9 pr-9',
          'text-sm font-semibold text-slate-700 outline-none',
          'focus:border-blue-400 focus:ring-2 focus:ring-blue-100',
        )}
      >
        {periodOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
