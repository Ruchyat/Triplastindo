import { Card } from '@/components/common'
import { ReportHeaderRow, ReportRow, ReportSectionTitle, ReportTitle } from '@/components/financial'
import { profitLossResults, profitLossSections, totalRevenue } from '@/mocks/reports'

/**
 * Laporan Laba Rugi.
 *
 * Retur dan potongan penjualan bersaldo normal debit sehingga tampil sebagai
 * pengurang di dalam kurung.
 */
export function ProfitLossReport() {
  return (
    <Card className="overflow-hidden p-4 md:p-7">
      <ReportTitle title="LAPORAN LABA RUGI" period="30 September 2026" />
      <ReportHeaderRow columns={['KETERANGAN', 'NOMINAL', '% REVENUE']} />

      {profitLossSections.map(section => (
        <div key={section.title}>
          <ReportSectionTitle>{section.title}</ReportSectionTitle>
          {section.rows.map(row => (
            <ReportRow key={row.label} label={row.label} amount={row.amount} base={totalRevenue} />
          ))}
          <ReportRow
            label={section.total.label}
            amount={section.total.amount}
            base={totalRevenue}
            emphasis="total"
          />
        </div>
      ))}

      <div className="mt-4 space-y-1">
        <ReportRow
          label="LABA KOTOR"
          amount={profitLossResults.grossProfit}
          base={totalRevenue}
          emphasis="highlight"
        />
        <ReportRow
          label="LABA OPERASIONAL"
          amount={profitLossResults.operatingProfit}
          base={totalRevenue}
          emphasis="total"
          className="bg-slate-100"
        />
        <ReportRow
          label="Pendapatan / (Beban) Lainnya"
          amount={profitLossResults.otherIncomeExpense}
          base={totalRevenue}
        />
        <ReportRow
          label="LABA BERSIH"
          amount={profitLossResults.netProfit}
          base={totalRevenue}
          emphasis="result"
        />
      </div>
    </Card>
  )
}
