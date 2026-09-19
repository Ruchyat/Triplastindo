import { useCallback, useState } from 'react'
import { Combobox, Field, InfoNote, Input } from '@/components/common'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import { monthNames } from '@/features/reports/useReportPeriod'
import { useAsync } from '@/hooks/useAsync'
import { today } from '@/lib'
import { ApiError } from '@/services/httpClient'
import { masterDataService } from '@/services/masterDataService'
import { payrollService } from '@/services/payrollService'
import type { ApiPayrollRun } from '@/types'

type Props = { onClose: () => void; onCreated: (run: ApiPayrollRun) => void }

/** Membuat draft payroll: barisnya terisi dari seluruh karyawan aktif. */
export function NewPayrollDrawer({ onClose, onCreated }: Props) {
  const now = new Date()
  const [year, setYear] = useState(String(now.getFullYear()))
  const [month, setMonth] = useState(String(now.getMonth() + 1))
  const [paymentDate, setPaymentDate] = useState(today())
  const [cashAccountId, setCashAccountId] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadCash = useCallback(() => masterDataService.accounts({ isCash: true }), [])
  const cashAccounts = useAsync(loadCash).data ?? []
  const years = Array.from({ length: 3 }, (_, i) => String(now.getFullYear() - 1 + i))

  async function save() {
    setIsSaving(true)
    setError(null)
    try {
      onCreated(await payrollService.create({ year: Number(year), month: Number(month), payment_date: paymentDate, cash_account_id: Number(cashAccountId) }))
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : 'Payroll gagal dibuat.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Drawer size="md" eyebrow="Payroll" title="Payroll Baru" description="Draft terisi dari gaji pokok dan allowance tiap karyawan aktif." onClose={onClose}>
      {error && <InfoNote tone="red">{error}</InfoNote>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Bulan" required>
          <Combobox clearable={false} options={monthNames.map((n, i) => ({ value: String(i + 1), label: n }))} value={month} onChange={setMonth} />
        </Field>
        <Field label="Tahun" required>
          <Combobox clearable={false} options={years.map(y => ({ value: y, label: y }))} value={year} onChange={setYear} />
        </Field>
      </div>
      <Field label="Tanggal Pembayaran" required>
        <Input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
      </Field>
      <Field label="Dibayar dari Akun" required>
        <Combobox placeholder="Pilih akun kas/bank..." options={cashAccounts.map(a => ({ value: String(a.id), label: a.label }))} value={cashAccountId} onChange={setCashAccountId} />
      </Field>
      <div className="flex justify-end gap-2 border-t border-slate-200 pt-5">
        <Button variant="ghost" onClick={onClose} disabled={isSaving}>Batal</Button>
        <Button disabled={!cashAccountId || !paymentDate || isSaving} onClick={() => void save()}>
          {isSaving ? 'Membuat...' : 'Buat Draft'}
        </Button>
      </div>
    </Drawer>
  )
}
