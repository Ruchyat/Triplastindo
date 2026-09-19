import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { routePaths } from '@/app/router'
import { SectionHeader } from '@/components/common'
import { cn, formatPercent } from '@/lib'
import type { ApiFinancialRatio } from '@/types'

const shortNames: Record<string, string> = {
  current_ratio: 'CR',
  quick_ratio: 'QR',
  gross_profit_margin: 'GPM',
  net_profit_margin: 'NPM',
  debt_to_equity: 'DER',
  cashflow_to_revenue: 'CFR',
  asset_turnover: 'AT',
}

const numberFormatter = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 })

const formatValue = (ratio: ApiFinancialRatio) =>
  ratio.value === null
    ? '–'
    : ratio.format === 'percent'
      ? formatPercent(ratio.value)
      : numberFormatter.format(ratio.value)

/** Ringkasan rasio keuangan YTD terhadap standar yang dipakai di sheet. */
export function RatioCard({ ratios }: { ratios: ApiFinancialRatio[] }) {
  const dashboardRatios = ratios.filter(ratio => ratio.standard !== null)

  return (
    <article className="card p-5 md:p-6">
      <SectionHeader title="Rasio Keuangan YTD" subtitle="Dibandingkan dengan standar perusahaan" />

      <div className="mt-5 divide-y divide-slate-100">
        {dashboardRatios.map(ratio => (
          <div key={ratio.key} className="flex items-center gap-3 py-3.5 first:pt-0">
            <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-[10px] font-bold text-slate-600">
              {shortNames[ratio.key] ?? '–'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-700">{ratio.name}</p>
              <p className="mt-0.5 text-[10px] text-slate-400">
                Standar {ratio.direction === 'min' ? '≥' : '≤'}{' '}
                {ratio.format === 'percent' ? formatPercent(ratio.standard ?? 0) : numberFormatter.format(ratio.standard ?? 0)}
              </p>
            </div>
            <p className="text-sm font-bold tabular-nums text-slate-900">{formatValue(ratio)}</p>
            <span
              className={cn(
                'min-w-[48px] rounded-full px-2 py-1 text-center text-[10px] font-bold',
                ratio.verdict === 'good'
                  ? 'bg-emerald-50 text-emerald-700'
                  : ratio.verdict === 'bad'
                    ? 'bg-rose-50 text-rose-700'
                    : 'bg-slate-100 text-slate-600',
              )}
            >
              {ratio.verdict === 'good' ? 'Good' : ratio.verdict === 'bad' ? 'Bad' : '–'}
            </span>
          </div>
        ))}
      </div>

      <Link to={routePaths.balanceSheet} className="mt-3 flex items-center gap-1 text-xs font-semibold text-blue-700">
        Lihat analisis rasio <ArrowRight size={13} />
      </Link>
    </article>
  )
}
