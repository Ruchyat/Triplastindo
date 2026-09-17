import type { ReactNode } from 'react'
import { cn, formatAccountingCurrency, formatRatioPercent } from '@/lib'

type ReportRowProps = {
  label: ReactNode
  amount: number
  /** Pembagi untuk kolom `% Revenue`. Nol atau kosong menghasilkan `–`. */
  base?: number
  /** Peran baris menentukan penekanan visualnya. */
  emphasis?: 'item' | 'total' | 'highlight' | 'result'
  className?: string
}

const emphases = {
  item: 'border-b border-slate-100 text-slate-600',
  total: 'border-y border-slate-300 font-bold text-slate-900',
  highlight: 'bg-blue-50 font-bold text-blue-900',
  result: 'bg-emerald-700 text-sm font-black text-white',
} as const

/** Satu baris laporan keuangan: keterangan, nominal, dan porsi terhadap pendapatan. */
export function ReportRow({ label, amount, base, emphasis = 'item', className }: ReportRowProps) {
  return (
    <div className={cn('report-row', emphases[emphasis], className)}>
      <span className={emphasis === 'item' ? 'pl-3' : undefined}>{label}</span>
      <span className={amount < 0 && emphasis === 'item' ? 'text-rose-700' : undefined}>
        {formatAccountingCurrency(amount)}
      </span>
      <span>{formatRatioPercent(amount, base)}</span>
    </div>
  )
}

/** Judul kelompok akun di dalam laporan, misalnya `PENDAPATAN`. */
export function ReportSectionTitle({ children }: { children: ReactNode }) {
  return <div className="mt-3 bg-slate-100 px-4 py-2 text-xs font-black text-slate-800">{children}</div>
}

/** Baris kepala tabel laporan. */
export function ReportHeaderRow({ columns }: { columns: [string, string, string] }) {
  return (
    <div className="report-row mt-3 bg-slate-800 font-bold text-white">
      {columns.map(column => (
        <span key={column}>{column}</span>
      ))}
    </div>
  )
}
