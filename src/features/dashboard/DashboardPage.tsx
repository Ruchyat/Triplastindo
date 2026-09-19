import { useCallback } from 'react'
import { CircleDollarSign, Receipt, TrendingUp, Wallet } from 'lucide-react'
import { InfoNote, PageHeader } from '@/components/common'
import { StatCard } from '@/components/financial'
import { useAsync } from '@/hooks/useAsync'
import { formatDate, formatPercent, toAmount } from '@/lib'
import { reportService } from '@/services/reportService'
import { useReportPeriod } from '@/features/reports/useReportPeriod'
import { CashAccountsTable } from './components/CashAccountsTable'
import { CashFlowCard } from './components/CashFlowCard'
import { PeriodSelect } from './components/PeriodSelect'
import { RatioCard } from './components/RatioCard'
import { RealizationCard } from './components/RealizationCard'
import { TrendCard } from './components/TrendCard'

const numberFormatter = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 })

/**
 * Dashboard.
 *
 * Ringkasan kondisi keuangan untuk pemilik dan manajemen, dirangkai backend
 * dari laporan yang sama — setiap angka di sini dapat ditelusuri ke Laba Rugi,
 * Neraca, Arus Kas, lalu Jurnal Umum.
 */
export function DashboardPage() {
  const state = useReportPeriod()
  const { year, month } = state

  const load = useCallback(() => reportService.dashboard({ year, month }), [year, month])
  const { data, error, isLoading } = useAsync(load)

  const kpi = data ? (state.ytd ? data.ytd : data.period) : null

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Overview / Dashboard"
        title="Dashboard"
        description="Ringkasan kondisi keuangan Triplastindo"
        actions={<PeriodSelect state={state} />}
      />

      {error && <InfoNote tone="red">{error}</InfoNote>}
      {isLoading && !data && <p className="text-xs text-slate-500">Memuat ringkasan...</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={toAmount(kpi?.revenue)}
          meta={
            kpi?.asset_turnover != null
              ? `Asset turnover ${numberFormatter.format(kpi.asset_turnover)}x`
              : state.rangeLabel
          }
          change={kpi?.revenue_change ?? undefined}
          icon={TrendingUp}
          tone="blue"
        />
        <StatCard
          title="Total Expenses"
          value={toAmount(kpi?.expenses)}
          meta={kpi?.expense_ratio != null ? `${formatPercent(kpi.expense_ratio)} dari pendapatan` : '–'}
          change={kpi?.expense_change ?? undefined}
          icon={Receipt}
          tone="amber"
        />
        <StatCard
          title="Net Profit"
          value={toAmount(kpi?.net_profit)}
          meta={
            kpi?.net_profit_margin != null
              ? `Net profit margin ${formatPercent(kpi.net_profit_margin)}`
              : '–'
          }
          change={kpi?.profit_change ?? undefined}
          icon={CircleDollarSign}
          tone="emerald"
        />
        <StatCard
          title="Saldo Kas Usaha"
          value={toAmount(data?.cash.total)}
          meta={data ? `Per ${formatDate(data.cash.as_of)}` : '–'}
          icon={Wallet}
          tone="cyan"
        />
      </div>

      {data && (
        <>
          <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
            <TrendCard monthly={data.monthly} year={data.year} />
            <RatioCard ratios={data.ratios} />
          </div>

          <CashFlowCard summary={data.cash_flow_ytd} year={data.year} />

          <div className="grid gap-4 xl:grid-cols-2">
            <RealizationCard type="payables" data={data.payables} year={data.year} />
            <RealizationCard type="receivables" data={data.receivables} year={data.year} />
          </div>

          <CashAccountsTable accounts={data.cash.accounts} total={data.cash.total} asOf={data.cash.as_of} />
        </>
      )}
    </div>
  )
}
