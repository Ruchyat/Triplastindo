import { useCallback } from 'react'
import { Card, CardHeader, EmptyState, InfoNote, TableWrap } from '@/components/common'
import { useAsync } from '@/hooks/useAsync'
import { formatCurrency, formatCurrencyOrDash, toAmount } from '@/lib'
import { payrollService } from '@/services/payrollService'

/** Summary gaji per karyawan setahun beserta monitoring kasbon. */
export function PayrollSummaryTab({ year }: { year: number }) {
  const load = useCallback(() => payrollService.summary(year), [year])
  const { data, error, isLoading } = useAsync(load)
  const rows = data?.employees ?? []

  if (error) return <InfoNote tone="red">{error}</InfoNote>

  return (
    <Card>
      <CardHeader title={`Summary Gaji & Kasbon ${year}`} description="Dari payroll yang sudah diposting" />
      {rows.length === 0 && !isLoading ? (
        <EmptyState title="Belum ada payroll diposting" description="Summary terisi setelah payroll pertama diposting." />
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <th>Karyawan</th>
              <th>Departemen</th>
              <th className="text-right">Bulan</th>
              <th className="text-right">Gaji Kotor</th>
              <th className="text-right">Gaji Bersih</th>
              <th className="text-right">THP</th>
              <th className="text-right">Pinjaman Kasbon</th>
              <th className="text-right">Potongan Kasbon</th>
              <th className="text-right">Sisa Kasbon</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.employee_id}>
                <td className="font-semibold">{r.name}</td>
                <td>{r.department_label}</td>
                <td className="money">{r.months}</td>
                <td className="money">{formatCurrency(toAmount(r.gross))}</td>
                <td className="money">{formatCurrency(toAmount(r.net))}</td>
                <td className="money !text-blue-700">{formatCurrency(toAmount(r.take_home))}</td>
                <td className="money">{formatCurrencyOrDash(toAmount(r.loan_advance))}</td>
                <td className="money">{formatCurrencyOrDash(toAmount(r.loan_deduction))}</td>
                <td className="money !text-amber-700">{formatCurrencyOrDash(toAmount(r.loan_balance))}</td>
              </tr>
            ))}
            <tr className="bg-slate-50 font-bold">
              <td colSpan={3}>Grand Total</td>
              <td className="money">{formatCurrency(rows.reduce((s, r) => s + toAmount(r.gross), 0))}</td>
              <td className="money">{formatCurrency(rows.reduce((s, r) => s + toAmount(r.net), 0))}</td>
              <td className="money !text-blue-700">{formatCurrency(rows.reduce((s, r) => s + toAmount(r.take_home), 0))}</td>
              <td className="money">{formatCurrency(rows.reduce((s, r) => s + toAmount(r.loan_advance), 0))}</td>
              <td className="money">{formatCurrency(rows.reduce((s, r) => s + toAmount(r.loan_deduction), 0))}</td>
              <td className="money !text-amber-700">{formatCurrency(rows.reduce((s, r) => s + toAmount(r.loan_balance), 0))}</td>
            </tr>
          </tbody>
        </TableWrap>
      )}
    </Card>
  )
}
