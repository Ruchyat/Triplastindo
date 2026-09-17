import { Card, Status } from '@/components/common'
import { ReportTitle } from '@/components/financial'
import { cn, formatAccountingCurrency, formatCurrency } from '@/lib'
import { balanceSheetSections, balanceSheetSummary } from '@/mocks/reports'
import type { BalanceSheetSection } from '@/types'

/**
 * Laporan Neraca.
 *
 * Total aset harus sama dengan total liabilitas dan ekuitas. Selisih yang
 * tidak nol ditampilkan sebagai peringatan, bukan disembunyikan.
 */
export function BalanceSheetReport() {
  const balanced = balanceSheetSummary.difference === 0

  return (
    <Card className="overflow-hidden p-4 md:p-7">
      <ReportTitle title="LAPORAN POSISI KEUANGAN" period="30 September 2026" />

      <div className="mt-4 grid gap-6 xl:grid-cols-2">
        {balanceSheetSections.map((section, index) => (
          <SectionBlock
            key={section.title}
            section={section}
            // Liabilitas dimulai di kolom kanan agar sejajar dengan Aset Lancar.
            className={index === 2 ? 'xl:col-start-2 xl:row-start-1' : undefined}
          />
        ))}
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
            Total aset sama dengan liabilitas dan ekuitas
          </p>
        </div>
        <Status tone={balanced ? 'green' : 'red'}>
          Selisih {formatCurrency(balanceSheetSummary.difference)}
        </Status>
      </div>
    </Card>
  )
}

function SectionBlock({ section, className }: { section: BalanceSheetSection; className?: string }) {
  const total = section.rows.reduce((sum, row) => sum + row.amount, 0)

  return (
    <div className={className}>
      <div className="bg-slate-800 px-4 py-2 text-xs font-black text-white">{section.title}</div>
      {section.rows.map(row => (
        <div
          key={row.label}
          className="flex justify-between border-b border-slate-100 px-4 py-3 text-xs"
        >
          <span className="text-slate-600">{row.label}</span>
          <b className="tabular-nums text-slate-800">{formatAccountingCurrency(row.amount)}</b>
        </div>
      ))}
      <div className="flex justify-between border-y border-slate-300 bg-slate-50 px-4 py-3 text-xs font-black">
        <span>TOTAL {section.title}</span>
        <span className="tabular-nums">{formatCurrency(total)}</span>
      </div>
    </div>
  )
}
