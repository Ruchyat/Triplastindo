import { Card } from '@/components/common'
import { ReportHeaderRow, ReportRow, ReportSectionTitle, ReportTitle } from '@/components/financial'
import { toAmount } from '@/lib'
import type { ApiProfitLoss } from '@/types'

type Props = {
  report: ApiProfitLoss
  periodLabel: string
}

/**
 * Laporan Laba Rugi, susunannya mengikuti tab LAPORAN LABA RUGI di sheet.
 *
 * Kolom `% Revenue` membagi tiap baris dengan total pendapatan. Retur dan
 * potongan penjualan bersaldo normal debit sehingga tampil sebagai pengurang
 * di dalam kurung.
 */
export function ProfitLossReport({ report, periodLabel }: Props) {
  const revenue = toAmount(report.results.revenue)
  const section = (key: string) => report.sections.find(candidate => candidate.key === key)
  const hasRows = (key: string) => (section(key)?.rows.length ?? 0) > 0

  const renderSection = (key: string) => {
    const current = section(key)
    if (!current) return null
    return (
      <div key={key}>
        <ReportSectionTitle>{current.title}</ReportSectionTitle>
        {current.rows.map(row => (
          <ReportRow
            key={row.account_id}
            label={`${row.code} · ${row.name}`}
            amount={toAmount(row.amount)}
            base={revenue}
          />
        ))}
        <ReportRow
          label={`TOTAL ${current.title}`}
          amount={toAmount(current.total)}
          base={revenue}
          emphasis="total"
        />
      </div>
    )
  }

  return (
    <Card className="overflow-hidden p-4 md:p-7">
      <ReportTitle title="LAPORAN LABA RUGI" period={periodLabel} />
      <ReportHeaderRow columns={['KETERANGAN', 'NOMINAL', '% REVENUE']} />

      {renderSection('revenue')}
      {renderSection('cogs')}
      <ReportRow
        label="LABA KOTOR (Gross Profit)"
        amount={toAmount(report.results.gross_profit)}
        base={revenue}
        emphasis="highlight"
        className="mt-2"
      />

      {renderSection('operating_expenses')}
      <ReportRow
        label="LABA OPERASIONAL"
        amount={toAmount(report.results.operating_profit)}
        base={revenue}
        emphasis="total"
        className="mt-2 bg-slate-100"
      />

      {hasRows('other_income') && renderSection('other_income')}
      {hasRows('other_expenses') && renderSection('other_expenses')}
      <ReportRow
        label="Pendapatan / (Beban) Lain-Lain"
        amount={toAmount(report.results.other_income_expense)}
        base={revenue}
        className="mt-2"
      />
      <ReportRow
        label="LABA SEBELUM PAJAK"
        amount={toAmount(report.results.profit_before_tax)}
        base={revenue}
        emphasis="total"
      />
      {hasRows('tax') && renderSection('tax')}
      <ReportRow
        label="LABA BERSIH"
        amount={toAmount(report.results.net_profit)}
        base={revenue}
        emphasis="result"
        className="mt-2"
      />
    </Card>
  )
}
