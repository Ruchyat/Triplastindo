import { Printer } from 'lucide-react'
import { Card, Combobox, Field } from '@/components/common'
import { Button } from '@/components/ui/Button'
import { monthNames, type ReportPeriodState } from '../useReportPeriod'

type Props = {
  state: ReportPeriodState
  /** Neraca selalu per tanggal, sehingga pilihan YTD tidak berlaku. */
  showYtd?: boolean
}

/** Filter periode dan tombol cetak yang sama untuk semua laporan keuangan. */
export function ReportControls({ state, showYtd = true }: Props) {
  const thisYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => String(thisYear - 3 + i))

  return (
    <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-end print:hidden">
      <Field label="Bulan" className="sm:w-44">
        <Combobox
          clearable={false}
          options={monthNames.map((name, index) => ({ value: String(index + 1), label: name }))}
          value={String(state.month)}
          onChange={value => state.setMonth(Number(value))}
        />
      </Field>
      <Field label="Tahun" className="sm:w-32">
        <Combobox
          clearable={false}
          options={years.map(year => ({ value: year, label: year }))}
          value={String(state.year)}
          onChange={value => state.setYear(Number(value))}
        />
      </Field>

      {showYtd && (
        <label className="flex h-10 items-center gap-2 text-xs font-semibold text-slate-600">
          <input
            type="checkbox"
            className="size-4 accent-blue-700"
            checked={state.ytd}
            onChange={event => state.setYtd(event.target.checked)}
          />
          Tampilkan YTD (sejak Januari)
        </label>
      )}

      <div className="flex gap-2 sm:ml-auto">
        <Button variant="outline" onClick={() => window.print()}>
          <Printer size={15} />
          Print
        </Button>
      </div>
    </Card>
  )
}
