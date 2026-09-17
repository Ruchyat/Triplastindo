import { useState } from 'react'
import { CircleDollarSign, Download, Receipt, TrendingUp, Wallet } from 'lucide-react'
import { PageHeader } from '@/components/common'
import { StatCard } from '@/components/financial'
import { Button } from '@/components/ui/Button'
import { formatDate, formatPercent } from '@/lib'
import { periodSummaries } from '@/mocks/dashboard'
import { activePeriod } from '@/mocks/session'
import type { PeriodKey } from '@/types'
import { CashAccountsTable } from './components/CashAccountsTable'
import { CashFlowCard } from './components/CashFlowCard'
import { PeriodSelect } from './components/PeriodSelect'
import { RatioCard } from './components/RatioCard'
import { RealizationCard } from './components/RealizationCard'
import { TrendCard } from './components/TrendCard'

/**
 * Dashboard.
 *
 * Ringkasan kondisi keuangan untuk pemilik dan manajemen. Setiap angka di
 * sini harus dapat ditelusuri sampai ke transaksi asalnya melalui laporan
 * dan Jurnal Umum.
 */
export function DashboardPage() {
  const [period, setPeriod] = useState<PeriodKey>('sep')
  const summary = periodSummaries[period]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Overview / Dashboard"
        title="Dashboard"
        description="Ringkasan kondisi keuangan Triplastindo"
        actions={
          <>
            <PeriodSelect value={period} onChange={setPeriod} />
            <Button variant="outline">
              <Download size={16} />
              Unduh ringkasan
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={summary.revenue}
          meta={`Asset turnover ${summary.turnover.toLocaleString('id-ID')}x`}
          change={summary.revenueChange}
          icon={TrendingUp}
          tone="blue"
        />
        <StatCard
          title="Total Expenses"
          value={summary.expenses}
          meta={`${formatPercent(summary.expenseRatio)} dari pendapatan`}
          change={summary.expenseChange}
          icon={Receipt}
          tone="amber"
        />
        <StatCard
          title="Net Profit"
          value={summary.profit}
          meta={`Net profit margin ${formatPercent(summary.npm)}`}
          change={summary.profitChange}
          icon={CircleDollarSign}
          tone="emerald"
        />
        <StatCard
          title="Saldo Kas Usaha"
          value={summary.cash}
          meta={`Per ${formatDate(activePeriod.asOf)}`}
          icon={Wallet}
          tone="cyan"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <TrendCard />
        <RatioCard />
      </div>

      <CashFlowCard />

      <div className="grid gap-4 xl:grid-cols-2">
        <RealizationCard type="payables" />
        <RealizationCard type="receivables" />
      </div>

      <CashAccountsTable />

      <p className="pb-2 text-center text-[11px] text-slate-400">
        Data dashboard merupakan data simulasi untuk kebutuhan tinjauan UI.
      </p>
    </div>
  )
}
