import { Link } from 'react-router-dom'
import { routePaths } from '@/app/router'
import { SectionHeader } from '@/components/common'
import { formatCurrency, toAmount } from '@/lib'
import type { ApiRealization } from '@/types'

type Props = {
  type: 'payables' | 'receivables'
  data: ApiRealization
  year: number
}

/** Realisasi utang atau piutang YTD dalam bentuk donut dan rincian nominal. */
export function RealizationCard({ type, data, year }: Props) {
  const isPayable = type === 'payables'
  const percentage = Math.round((data.percentage ?? 0) * 100)

  return (
    <article className="card p-5">
      <div className="flex items-start justify-between">
        <SectionHeader
          title={isPayable ? 'Realisasi Utang' : 'Realisasi Piutang'}
          subtitle={`Year to date ${year}`}
        />
        <Link
          to={isPayable ? routePaths.payables : routePaths.receivables}
          className="text-xs font-semibold text-blue-700 hover:text-blue-900"
        >
          Lihat detail
        </Link>
      </div>

      <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row">
        <ProgressRing value={percentage} color={isPayable ? '#2563eb' : '#059669'} />

        <div className="w-full flex-1 space-y-3">
          <div>
            <p className="text-[11px] text-slate-500">Total {isPayable ? 'Utang' : 'Piutang'}</p>
            <p className="text-sm font-bold text-slate-900">{formatCurrency(toAmount(data.total))}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
            <div>
              <p className="text-[10px] text-slate-500">Terbayar</p>
              <p className="mt-1 text-xs font-semibold text-emerald-700">
                {formatCurrency(toAmount(data.paid), true)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500">
                {isPayable ? 'Outstanding' : 'Belum tertagih'}
              </p>
              <p className="mt-1 text-xs font-semibold text-amber-700">
                {formatCurrency(toAmount(data.outstanding), true)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

function ProgressRing({ value, color }: { value: number; color: string }) {
  return (
    <div
      className="relative grid size-28 place-items-center rounded-full"
      style={{ background: `conic-gradient(${color} ${value}%, #e8edf3 0)` }}
    >
      <div className="grid size-[84px] place-items-center rounded-full bg-white text-center">
        <div>
          <p className="text-2xl font-bold text-slate-900">{value}%</p>
          <p className="text-[10px] font-semibold text-slate-400">TERCAPAI</p>
        </div>
      </div>
    </div>
  )
}
