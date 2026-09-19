import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { routePaths } from '@/app/router'
import { Card, CardHeader, InfoNote, NumberInput, Status, TableWrap } from '@/components/common'
import { JournalEntryCard } from '@/components/financial'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { monthNames } from '@/features/reports/useReportPeriod'
import { useAsync } from '@/hooks/useAsync'
import { formatCurrency, formatDate, toAmount } from '@/lib'
import { ApiError } from '@/services/httpClient'
import { payrollService, type PayrollItemPatch } from '@/services/payrollService'
import type { ApiPayrollItem, PayrollAmountField } from '@/types'

type Props = { runId: number; canWrite: boolean; onChanged: () => void }

const columns: { key: PayrollAmountField; label: string; kind: 'earning' | 'deduction' | 'loan' }[] = [
  { key: 'basic_salary', label: 'Gaji Pokok', kind: 'earning' },
  { key: 'overtime', label: 'Lembur', kind: 'earning' },
  { key: 'allowance', label: 'Allowance', kind: 'earning' },
  { key: 'bonus', label: 'Tunjangan / Bonus', kind: 'earning' },
  { key: 'tax_pph21', label: 'PPh 21', kind: 'deduction' },
  { key: 'bpjs_employment', label: 'BPJS TK', kind: 'deduction' },
  { key: 'bpjs_health', label: 'BPJS Kes', kind: 'deduction' },
  { key: 'loan_advance', label: 'Pinjaman Kasbon', kind: 'loan' },
  { key: 'loan_deduction', label: 'Potongan Kasbon', kind: 'loan' },
]

/**
 * Rincian satu payroll: baris per karyawan yang dapat disunting selama draft,
 * lalu diposting menjadi satu jurnal.
 */
export function PayrollRunView({ runId, canWrite, onChanged }: Props) {
  const load = useCallback(() => payrollService.show(runId), [runId])
  const { data: run, error, reload } = useAsync(load)
  const [edits, setEdits] = useState<Record<number, Partial<Record<PayrollAmountField, string>>>>({})
  const [confirm, setConfirm] = useState<'post' | 'cancel' | null>(null)
  const [isWorking, setIsWorking] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const isDraft = run?.status === 'draft'
  const editable = canWrite && isDraft
  const dirty = Object.keys(edits).length > 0

  const valueOf = (item: ApiPayrollItem, key: PayrollAmountField) => edits[item.employee_id]?.[key] ?? item[key]

  async function saveEdits() {
    setIsWorking(true)
    setActionError(null)
    try {
      const items: PayrollItemPatch[] = Object.entries(edits).map(([employeeId, patch]) => ({ employee_id: Number(employeeId), ...patch }))
      await payrollService.updateItems(runId, items)
      setEdits({})
      reload()
      onChanged()
    } catch (failure) {
      setActionError(failure instanceof ApiError ? failure.message : 'Gagal menyimpan.')
    } finally {
      setIsWorking(false)
    }
  }

  async function act() {
    if (!confirm) return
    setIsWorking(true)
    setActionError(null)
    try {
      if (confirm === 'post') await payrollService.post(runId)
      else await payrollService.cancel(runId)
      reload()
      onChanged()
      setConfirm(null)
    } catch (failure) {
      setActionError(failure instanceof ApiError ? failure.message : 'Gagal memproses payroll.')
    } finally {
      setIsWorking(false)
    }
  }

  if (error) return <InfoNote tone="red">{error}</InfoNote>
  if (!run) return <p className="text-xs text-slate-500">Memuat...</p>

  const preview = (item: ApiPayrollItem) => {
    const n = (k: PayrollAmountField) => toAmount(valueOf(item, k))
    const gross = n('basic_salary') + n('overtime') + n('allowance') + n('bonus')
    const net = gross - n('tax_pph21') - n('bpjs_employment') - n('bpjs_health')
    return { gross, net, thp: net + n('loan_advance') - n('loan_deduction') }
  }

  const totals = (run.items ?? []).reduce(
    (t, item) => {
      const p = preview(item)
      return { gross: t.gross + p.gross, net: t.net + p.net, thp: t.thp + p.thp }
    },
    { gross: 0, net: 0, thp: 0 },
  )

  return (
    <div className="space-y-5">
      {actionError && !confirm && <InfoNote tone="red">{actionError}</InfoNote>}

      <Card>
        <CardHeader
          title={`Payroll ${monthNames[run.month - 1]} ${run.year}`}
          description={`${run.number} · dibayar ${formatDate(run.payment_date)} dari ${run.cash_account?.name ?? '–'}`}
          action={
            <div className="flex items-center gap-2">
              <Status tone={run.status === 'posted' ? 'green' : 'slate'}>
                {run.status === 'draft' ? 'Draft' : run.status === 'posted' ? 'Diposting' : 'Dibatalkan'}
              </Status>
              {editable && dirty && (
                <Button variant="outline" disabled={isWorking} onClick={() => void saveEdits()}>Simpan Perubahan</Button>
              )}
              {editable && !dirty && (
                <Button disabled={isWorking || (run.items ?? []).length === 0} onClick={() => setConfirm('post')}>Posting Payroll</Button>
              )}
              {canWrite && run.status === 'posted' && (
                <Button variant="outline" disabled={isWorking} onClick={() => setConfirm('cancel')}>Batalkan</Button>
              )}
            </div>
          }
        />
        <TableWrap>
          <thead>
            <tr>
              <th>Karyawan</th>
              {columns.map(c => <th key={c.key} className="text-right">{c.label}</th>)}
              <th className="text-right">Gaji Kotor</th>
              <th className="text-right">Gaji Bersih</th>
              <th className="text-right">THP</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {(run.items ?? []).map(item => {
              const p = preview(item)
              return (
                <tr key={item.id}>
                  <td>
                    <span className="block font-semibold">{item.employee?.name}</span>
                    <span className="text-[10px] text-slate-500">{item.employee?.nik} · {item.employee?.department_label}{item.employee?.position ? ` · ${item.employee.position}` : ''}</span>
                  </td>
                  {columns.map(c => (
                    <td key={c.key} className="money">
                      {editable ? (
                        <NumberInput
                          className={`ml-auto w-32 ${c.kind === 'deduction' ? 'text-rose-700' : ''}`}
                          value={valueOf(item, c.key)}
                          onChange={value => setEdits({ ...edits, [item.employee_id]: { ...edits[item.employee_id], [c.key]: value } })}
                        />
                      ) : (
                        <span className={c.kind === 'deduction' ? 'text-rose-700' : undefined}>{formatCurrency(toAmount(item[c.key]))}</span>
                      )}
                    </td>
                  ))}
                  <td className="money">{formatCurrency(p.gross)}</td>
                  <td className="money">{formatCurrency(p.net)}</td>
                  <td className="money !text-blue-700">{formatCurrency(p.thp)}</td>
                  <td>
                    <Link to={`${routePaths.payslips}?run=${run.id}&employee=${item.employee_id}`} className="text-xs font-semibold text-blue-700">
                      Slip
                    </Link>
                  </td>
                </tr>
              )
            })}
            <tr className="bg-slate-50 font-bold">
              <td colSpan={columns.length + 1}>Total {run.items?.length ?? 0} karyawan</td>
              <td className="money">{formatCurrency(totals.gross)}</td>
              <td className="money">{formatCurrency(totals.net)}</td>
              <td className="money !text-blue-700">{formatCurrency(totals.thp)}</td>
              <td />
            </tr>
          </tbody>
        </TableWrap>
        <p className="px-5 py-3 text-[11px] text-slate-500">
          Kotor = pokok + lembur + allowance + bonus · Bersih = kotor − PPh 21 − BPJS · THP = bersih + pinjaman kasbon − potongan kasbon.
        </p>
      </Card>

      {run.journal_entry && (
        <Card className="p-5">
          <p className="mb-3 text-xs font-bold text-slate-800">Jurnal Payroll</p>
          <JournalEntryCard entry={run.journal_entry} />
        </Card>
      )}

      {confirm && (
        <ConfirmDialog
          title={confirm === 'post' ? `Posting payroll ${monthNames[run.month - 1]} ${run.year}?` : `Batalkan payroll ${run.number}?`}
          description={
            confirm === 'post'
              ? `Jurnal terbentuk: beban gaji per departemen, kasbon ke Piutang Karyawan, PPh 21 dan BPJS ke utang, dan ${formatCurrency(totals.thp)} keluar dari ${run.cash_account?.name}. Setelah diposting baris tidak dapat diubah.`
              : `Jurnal ${run.journal_entry?.number} dibalik dan payroll ditandai batal.`
          }
          confirmLabel={confirm === 'post' ? 'Posting' : 'Batalkan Payroll'}
          tone={confirm === 'post' ? 'default' : 'danger'}
          isWorking={isWorking}
          error={actionError}
          onCancel={() => setConfirm(null)}
          onConfirm={() => void act()}
        />
      )}
    </div>
  )
}
