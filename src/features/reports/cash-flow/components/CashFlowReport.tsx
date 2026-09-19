import { Card } from '@/components/common'
import { ReportTitle } from '@/components/financial'
import { cn, formatAccountingCurrency, formatCurrency, toAmount } from '@/lib'
import type { ApiCashFlow } from '@/types'

type Props = {
  report: ApiCashFlow
  periodLabel: string
}

const rowStyles = {
  section: 'mt-3 bg-slate-800 font-black text-white',
  item: 'border-b border-slate-100 text-slate-600',
  total: 'border-y border-slate-300 bg-slate-50 font-black text-slate-900',
} as const

/**
 * Laporan Arus Kas metode langsung, susunannya mengikuti tab LAPORAN ARUS KAS
 * di sheet. Kategorinya disimpulkan backend dari akun lawan tiap jurnal kas.
 */
export function CashFlowReport({ report, periodLabel }: Props) {
  return (
    <Card className="overflow-hidden p-4 md:p-7">
      <ReportTitle title="LAPORAN ARUS KAS" period={periodLabel} />

      <div className="mt-4">
        {report.activities.map(activity => (
          <div key={activity.key}>
            <Row kind="section" label={activity.title} />
            {activity.rows.map(row => (
              <Row key={row.key} kind="item" label={row.label} amount={toAmount(row.amount)} />
            ))}
            <Row kind="total" label={`Jumlah ${activity.title.replace('ARUS KAS DARI', 'Arus Kas Bersih dari')}`} amount={toAmount(activity.total)} />
          </div>
        ))}

        <div className="mt-5 space-y-1">
          <div className="flex justify-between px-4 py-3 text-xs">
            <b>SALDO KAS AWAL</b>
            <b className="tabular-nums">{formatCurrency(toAmount(report.summary.opening_balance))}</b>
          </div>
          <div className="flex justify-between bg-blue-50 px-4 py-3 text-xs">
            <b>KENAIKAN / (PENURUNAN) KAS</b>
            <b className="tabular-nums">{formatAccountingCurrency(toAmount(report.summary.net_change))}</b>
          </div>
          <div className="flex justify-between bg-blue-700 px-4 py-4 text-sm font-black text-white">
            <span>SALDO KAS AKHIR</span>
            <span className="tabular-nums">{formatCurrency(toAmount(report.summary.closing_balance))}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}

function Row({ kind, label, amount }: { kind: keyof typeof rowStyles; label: string; amount?: number }) {
  return (
    <div className={cn('flex justify-between px-4 py-3 text-xs', rowStyles[kind])}>
      <span className={kind === 'item' ? 'pl-3' : undefined}>{label}</span>
      <span className="font-semibold tabular-nums">
        {amount === undefined ? '' : formatAccountingCurrency(amount)}
      </span>
    </div>
  )
}
