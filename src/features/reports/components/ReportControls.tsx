import { Download, Printer } from 'lucide-react'
import { Card, Field, Select } from '@/components/common'
import { Button } from '@/components/ui/Button'

/** Filter periode dan tombol cetak/ekspor yang sama untuk semua laporan keuangan. */
export function ReportControls() {
  return (
    <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-end">
      <Field label="Bulan">
        <Select>
          <option>September</option>
          <option>Juni</option>
        </Select>
      </Field>
      <Field label="Tahun">
        <Select>
          <option>2026</option>
        </Select>
      </Field>

      <label className="flex h-10 items-center gap-2 text-xs font-semibold text-slate-600">
        <input type="checkbox" className="size-4 accent-blue-700" />
        Tampilkan YTD
      </label>

      <div className="flex gap-2 sm:ml-auto">
        <Button variant="outline">
          <Printer size={15} />
          Print
        </Button>
        <Button variant="outline">
          <Download size={15} />
          PDF
        </Button>
        <Button variant="outline">
          <Download size={15} />
          Excel
        </Button>
      </div>
    </Card>
  )
}
