import { Card, Status } from '@/components/common'
import { ReportTitle } from '@/components/financial'
import { cn, formatAccountingCurrency, formatCurrency, toAmount } from '@/lib'
import type { ApiBalanceSheet, ApiReportSection } from '@/types'

type Props = {
  report: ApiBalanceSheet
  periodLabel: string
}

/**
 * Laporan Neraca, susunannya mengikuti tab LAPORAN NERACA di sheet.
 *
 * Total aset harus sama dengan total liabilitas dan ekuitas. Selisih yang
 * tidak nol ditampilkan sebagai peringatan, bukan disembunyikan. Laba yang
 * belum ditutup ke ekuitas ditampilkan sebagai dua baris hitungan.
 */
export function BalanceSheetReport({ report, periodLabel }: Props) {
  const difference = toAmount(report.totals.difference)
  const balanced = difference === 0
  const section = (key: string) => report.sections.find(candidate => candidate.key === key)!

  const earningsRows = [
    { label: 'Laba Ditahan (periode lalu)', amount: toAmount(report.earnings.retained_prior) },
    { label: 'Laba Tahun Berjalan', amount: toAmount(report.earnings.current_year) },
  ]

  return (
    <Card className="overflow-hidden p-4 md:p-7">
      <ReportTitle title="LAPORAN POSISI KEUANGAN" period={periodLabel} />

      <div className="mt-4 grid gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <SectionBlock section={section('current_assets')} />
          <SectionBlock section={section('fixed_assets')} />
          <SectionBlock section={section('accumulated_depreciation')} negative />
          <GrandTotal label="TOTAL ASET" amount={toAmount(report.totals.total_assets)} />
        </div>
        <div className="space-y-6">
          <SectionBlock section={section('liabilities')} />
          <SectionBlock
            section={section('equity')}
            extraRows={earningsRows}
            totalOverride={toAmount(report.totals.equity)}
          />
          <GrandTotal
            label="TOTAL LIABILITAS & EKUITAS"
            amount={toAmount(report.totals.total_liabilities_equity)}
          />
        </div>
      </div>

      <div
        className={cn(
          'mt-6 flex items-center justify-between rounded-xl p-4',
          balanced ? 'bg-emerald-50' : 'bg-rose-50',
        )}
      >
        <div>
          <p className={cn('text-xs font-bold', balanced ? 'text-emerald-900' : 'text-rose-900')}>
            {balanced ? 'NERACA BALANCE' : 'NERACA TIDAK BALANCE'}
          </p>
          <p className={cn('mt-1 text-[10px]', balanced ? 'text-emerald-700' : 'text-rose-700')}>
            Total aset {balanced ? 'sama dengan' : 'berbeda dari'} liabilitas dan ekuitas
          </p>
        </div>
        <Status tone={balanced ? 'green' : 'red'}>Selisih {formatCurrency(difference)}</Status>
      </div>
    </Card>
  )
}

type SectionProps = {
  section: ApiReportSection
  /** Kontra aset: nilainya mengurangi, ditampilkan dalam kurung. */
  negative?: boolean
  extraRows?: { label: string; amount: number }[]
  totalOverride?: number
}

function SectionBlock({ section, negative, extraRows = [], totalOverride }: SectionProps) {
  const rows = section.rows.filter(row => toAmount(row.amount) !== 0)
  const total = totalOverride ?? toAmount(section.total)
  const sign = negative ? -1 : 1

  return (
    <div>
      <div className="bg-slate-800 px-4 py-2 text-xs font-black text-white">{section.title}</div>
      {rows.length === 0 && extraRows.length === 0 && (
        <p className="px-4 py-3 text-xs text-slate-400">Tidak ada saldo.</p>
      )}
      {rows.map(row => (
        <div key={row.account_id} className="flex justify-between border-b border-slate-100 px-4 py-2.5 text-xs">
          <span className="text-slate-600">
            <span className="text-slate-400">{row.code}</span> {row.name}
          </span>
          <b className="tabular-nums text-slate-800">{formatAccountingCurrency(sign * toAmount(row.amount))}</b>
        </div>
      ))}
      {extraRows.map(row => (
        <div key={row.label} className="flex justify-between border-b border-slate-100 bg-blue-50/50 px-4 py-2.5 text-xs">
          <span className="italic text-slate-600">{row.label}</span>
          <b className="tabular-nums text-slate-800">{formatAccountingCurrency(row.amount)}</b>
        </div>
      ))}
      <div className="flex justify-between border-y border-slate-300 bg-slate-50 px-4 py-3 text-xs font-black">
        <span>TOTAL {section.title}</span>
        <span className="tabular-nums">{formatAccountingCurrency(sign * total)}</span>
      </div>
    </div>
  )
}

function GrandTotal({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="flex justify-between bg-blue-700 px-4 py-4 text-sm font-black text-white">
      <span>{label}</span>
      <span className="tabular-nums">{formatCurrency(amount)}</span>
    </div>
  )
}
