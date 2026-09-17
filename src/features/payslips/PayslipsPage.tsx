import { useState } from 'react'
import { Download, Eye, Printer } from 'lucide-react'
import { Card, Field, PageHeader, Select } from '@/components/common'
import { Button } from '@/components/ui/Button'
import { payrollRows, samplePayslip } from '@/mocks/payroll'
import { PayslipDocument } from './components/PayslipDocument'

/**
 * Halaman Slip Gaji.
 *
 * Preview slip disusun dalam layout A4 agar hasil cetaknya sesuai dengan
 * yang terlihat di layar.
 */
export function PayslipsPage() {
  const [employeeId, setEmployeeId] = useState(samplePayslip.employeeId)

  // Selama tahap UI hanya tersedia satu rincian slip contoh; identitas
  // karyawan tetap mengikuti pilihan agar interaksinya terasa nyata.
  const employee = payrollRows.find(row => row.employeeId === employeeId)
  const payslip = {
    ...samplePayslip,
    employeeId,
    name: employee?.name ?? samplePayslip.name,
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Payroll / Slip Gaji"
        title="Slip Gaji"
        description="Preview, cetak, dan unduh slip gaji karyawan"
        actions={
          <>
            <Button variant="outline">
              <Printer size={15} />
              Cetak Massal
            </Button>
            <Button variant="outline">
              <Download size={15} />
              Download PDF
            </Button>
          </>
        }
      />

      <Card className="p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Karyawan">
            <Select
              className="w-full"
              value={employeeId}
              onChange={event => setEmployeeId(event.target.value)}
            >
              {payrollRows.map(row => (
                <option key={row.employeeId} value={row.employeeId}>
                  {row.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Periode">
            <Select className="w-full">
              <option>September 2026</option>
            </Select>
          </Field>
          <div className="flex items-end">
            <Button variant="outline" className="w-full">
              <Eye size={15} />
              Tampilkan Preview
            </Button>
          </div>
        </div>
      </Card>

      <PayslipDocument payslip={payslip} />
    </div>
  )
}
