import { CalendarDays } from 'lucide-react'
import { Combobox } from '@/components/common'
import { monthNames, type ReportPeriodState } from '@/features/reports/useReportPeriod'

/** Pemilih periode Dashboard: bulan tertentu, atau akumulasi sejak Januari. */
export function PeriodSelect({ state }: { state: ReportPeriodState }) {
  const thisYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => String(thisYear - 3 + i))

  return (
    <div className="flex flex-wrap items-center gap-2">
      <CalendarDays size={16} className="text-slate-400" />
      <Combobox
        className="w-36"
        clearable={false}
        aria-label="Bulan"
        options={monthNames.map((name, index) => ({ value: String(index + 1), label: name }))}
        value={String(state.month)}
        onChange={value => state.setMonth(Number(value))}
      />
      <Combobox
        className="w-24"
        clearable={false}
        aria-label="Tahun"
        options={years.map(year => ({ value: year, label: year }))}
        value={String(state.year)}
        onChange={value => state.setYear(Number(value))}
      />
      <label className="flex h-10 items-center gap-2 text-xs font-semibold text-slate-600">
        <input
          type="checkbox"
          className="size-4 accent-blue-700"
          checked={state.ytd}
          onChange={event => state.setYtd(event.target.checked)}
        />
        YTD
      </label>
    </div>
  )
}
