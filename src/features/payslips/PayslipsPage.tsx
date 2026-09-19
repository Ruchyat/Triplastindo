import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Printer } from 'lucide-react'
import { Card, Combobox, Field, InfoNote, PageHeader } from '@/components/common'
import { Button } from '@/components/ui/Button'
import { monthNames } from '@/features/reports/useReportPeriod'
import { useAsync } from '@/hooks/useAsync'
import { formatDate, toAmount } from '@/lib'
import { payrollService } from '@/services/payrollService'
import { setupService } from '@/services/setupService'
import type { ApiPayrollItem, ApiPayrollRun } from '@/types'
import { PayslipDocument, type Payslip } from './components/PayslipDocument'

/**
 * Slip gaji dari payroll yang sudah diposting. `?run=&employee=` membuka slip
 * tertentu, dipakai tautan dari halaman Gaji Karyawan.
 */
export function PayslipsPage() {
  const [params] = useSearchParams()
  const [runId, setRunId] = useState(params.get('run') ?? '')
  const [employeeId, setEmployeeId] = useState(params.get('employee') ?? '')

  const loadRuns = useCallback(() => payrollService.list(), [])
  const runs = (useAsync(loadRuns).data ?? []).filter(r => r.status === 'posted')

  const loadRun = useCallback(() => (runId ? payrollService.show(Number(runId)) : Promise.resolve(null)), [runId])
  const { data: run, error } = useAsync(loadRun)

  const loadSettings = useCallback(() => setupService.settings(), [])
  const company = useAsync(loadSettings).data?.company

  const items = run?.items ?? []
  const selected = items.filter(item => !employeeId || String(item.employee_id) === employeeId)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Payroll / Slip Gaji"
        title="Slip Gaji"
        description="Cetak slip satu karyawan atau seluruh karyawan dalam satu periode"
        actions={
          <Button variant="outline" disabled={selected.length === 0} onClick={() => window.print()}>
            <Printer size={15} />
            Cetak {selected.length > 1 ? `${selected.length} Slip` : 'Slip'}
          </Button>
        }
      />

      <Card className="grid gap-4 p-4 sm:grid-cols-2 print:hidden">
        <Field label="Periode Payroll">
          <Combobox
            placeholder="Pilih periode..."
            options={runs.map(r => ({ value: String(r.id), label: `${monthNames[r.month - 1]} ${r.year}`, description: `${r.number} · ${formatDate(r.payment_date)}` }))}
            value={runId}
            onChange={value => {
              setRunId(value)
              setEmployeeId('')
            }}
          />
        </Field>
        <Field label="Karyawan">
          <Combobox
            placeholder="Semua karyawan"
            options={items.map(item => ({ value: String(item.employee_id), label: item.employee?.name ?? '', description: item.employee?.nik }))}
            value={employeeId}
            onChange={setEmployeeId}
          />
        </Field>
      </Card>

      {error && <InfoNote tone="red">{error}</InfoNote>}
      {!runId && <p className="text-xs text-slate-500">Pilih periode payroll yang sudah diposting.</p>}

      <div className="space-y-6">
        {run && company && selected.map(item => (
          <div key={item.id} className="print:break-after-page">
            <PayslipDocument payslip={toPayslip(run, item)} company={company} />
          </div>
        ))}
      </div>
    </div>
  )
}

function toPayslip(run: ApiPayrollRun, item: ApiPayrollItem): Payslip {
  return {
    employeeId: item.employee?.nik ?? '',
    name: item.employee?.name ?? '',
    department: [item.employee?.department_label, item.employee?.position].filter(Boolean).join(' / '),
    period: `${monthNames[run.month - 1]} ${run.year}`,
    paymentDate: formatDate(run.payment_date),
    earnings: [
      { label: 'Gaji Pokok', amount: toAmount(item.basic_salary) },
      { label: 'Upah Lembur', amount: toAmount(item.overtime) },
      { label: 'Allowance', amount: toAmount(item.allowance) },
      { label: 'Tunjangan / Bonus', amount: toAmount(item.bonus) },
    ],
    deductions: [
      { label: 'PPh 21', amount: toAmount(item.tax_pph21) },
      { label: 'BPJS Ketenagakerjaan', amount: toAmount(item.bpjs_employment) },
      { label: 'BPJS Kesehatan', amount: toAmount(item.bpjs_health) },
      { label: 'Potongan Kasbon', amount: toAmount(item.loan_deduction) },
    ],
    loanAdvance: toAmount(item.loan_advance),
  }
}
