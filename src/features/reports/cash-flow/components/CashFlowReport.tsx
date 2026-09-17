import { Card } from '@/components/common'
import { ReportTitle } from '@/components/financial'
import { cn, formatAccountingCurrency, formatCurrency } from '@/lib'
import { cashFlowRows, cashFlowSummary } from '@/mocks/reports'
import type { CashFlowRow } from '@/types'

const rowStyles: Record<CashFlowRow['kind'], string> = {
  section: 'mt-3 bg-slate-800 font-black text-white',
  item: 'border-b border-slate-100 text-slate-600',
  total: 'border-y border-slate-300 bg-slate-50 font-black text-slate-900',
}

/**
 * Laporan Arus Kas.
 *
 * Dihitung hanya dari baris jurnal bertagging `Kas & Bank`, dengan melihat
 * akun lawannya — bukan akun kas itu sendiri.
 */
export function CashFlowReport() {
  return (
    <Card className="overflow-hidden p-4 md:p-7">
      <ReportTitle title="LAPORAN ARUS KAS" period="30 September 2026" />

      <div className="mt-4">
        {cashFlowRows.map((row, index) => (
          <div
            key={`${row.label}-${index}`}
            className={cn('flex justify-between px-4 py-3 text-xs', rowStyles[row.kind])}
          >
            <span>{row.label}</span>
            <span className="font-semibold tabular-nums">
              {row.kind === 'section' ? '' : formatAccountingCurrency(row.amount)}
            </span>
          </div>
        ))}

        <div className="mt-5 space-y-1">
          <div className="flex justify-between px-4 py-3 text-xs">
            <b>SALDO KAS AWAL</b>
            <b className="tabular-nums">{formatCurrency(cashFlowSummary.openingBalance)}</b>
          </div>
          <div className="flex justify-between bg-blue-50 px-4 py-3 text-xs">
            <b>KENAIKAN / (PENURUNAN) KAS</b>
            <b className="tabular-nums">{formatAccountingCurrency(cashFlowSummary.netChange)}</b>
          </div>
          <div className="flex justify-between bg-blue-700 px-4 py-4 text-sm font-black text-white">
            <span>SALDO KAS AKHIR</span>
            <span className="tabular-nums">{formatCurrency(cashFlowSummary.closingBalance)}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
