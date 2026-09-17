import { Plus } from 'lucide-react'
import {
  Card,
  FilterBar,
  MiniStat,
  PageHeader,
  Select,
  Status,
  TableWrap,
} from '@/components/common'
import { Button } from '@/components/ui/Button'
import { cn, formatCurrency } from '@/lib'
import { payrollRows, payrollSummary } from '@/mocks/payroll'

/**
 * Halaman Gaji Karyawan.
 *
 * Gaji Kotor = Pokok + Lembur + Allowance + Tunjangan.
 * THP = Gaji Bersih + Pinjaman Kasbon − Potongan Kasbon.
 */
export function PayrollPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Payroll / Gaji Karyawan"
        title="Payroll"
        description="Kelola gaji karyawan Triplastindo"
        actions={
          <Button>
            <Plus size={16} />
            Buat Payroll
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Total Gaji Kotor" value={payrollSummary.grossTotal} />
        <MiniStat label="Total Potongan" value={payrollSummary.deductionTotal} tone="amber" />
        <MiniStat label="Total THP" value={payrollSummary.takeHomeTotal} tone="green" />
        <MiniStat label="Jumlah Karyawan" value={payrollSummary.employeeCount} />
      </div>

      <Card>
        <FilterBar>
          <Select>
            <option>September 2026</option>
          </Select>
          <Select>
            <option>Semua Departemen</option>
          </Select>
          <Select>
            <option>Semua Status</option>
          </Select>
        </FilterBar>

        <TableWrap>
          <thead>
            <tr>
              <th>Karyawan</th>
              <th>Status</th>
              <th className="text-right">Gaji Pokok</th>
              <th className="text-right">Lembur</th>
              <th className="text-right">Allowance</th>
              <th className="text-right">Bonus</th>
              <th className="text-right">Potongan</th>
              <th className="text-right">THP</th>
            </tr>
          </thead>
          <tbody>
            {payrollRows.map(row => (
              <tr key={row.employeeId}>
                <td>
                  <p className="font-semibold text-slate-800">{row.name}</p>
                  <p className="mt-1 text-[10px] text-slate-400">{row.employeeId}</p>
                </td>
                <td>
                  <Status>{row.status}</Status>
                </td>
                <td className="money">{formatCurrency(row.basicSalary)}</td>
                <td className="money">{formatCurrency(row.overtime)}</td>
                <td className="money">{formatCurrency(row.allowance)}</td>
                <td className="money">{formatCurrency(row.bonus)}</td>
                <td className={cn('money', '!text-amber-700')}>{formatCurrency(row.deduction)}</td>
                <td className={cn('money', '!text-emerald-700')}>
                  {formatCurrency(row.takeHomePay)}
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Card>
    </div>
  )
}
