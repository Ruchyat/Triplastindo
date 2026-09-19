import { useCallback, useState } from 'react'
import { Combobox, Field, InfoNote, Input, NumberInput, Textarea } from '@/components/common'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import { monthNames } from '@/features/reports/useReportPeriod'
import { useAsync } from '@/hooks/useAsync'
import { formatCurrency, formatPercent, toAmount, today } from '@/lib'
import { ApiError } from '@/services/httpClient'
import { dividendService } from '@/services/dividendService'
import { masterDataService } from '@/services/masterDataService'
import { setupService } from '@/services/setupService'
import type { ApiDividendCheckpoint } from '@/types'

type Props = { checkpoint: ApiDividendCheckpoint; onClose: () => void; onSaved: () => void }

/** Pengajuan dividen: total dibagi ke pemegang saham menurut % saham, dipotong pajak final. */
export function ProposalDrawer({ checkpoint, onClose, onSaved }: Props) {
  const [total, setTotal] = useState('')
  const [decisionDate, setDecisionDate] = useState(today())
  const [cashAccountId, setCashAccountId] = useState('')
  const [note, setNote] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadRefs = useCallback(() => Promise.all([masterDataService.accounts({ isCash: true }), setupService.shareholders(), setupService.settings()]), [])
  const [cashAccounts = [], shareholders, settings] = useAsync(loadRefs).data ?? []
  const taxRate = settings?.parameters.dividend_tax_rate ?? 0.1
  const activeShareholders = (shareholders?.data ?? []).filter(s => s.is_active)

  async function save() {
    setIsSaving(true)
    setError(null)
    try {
      await dividendService.propose({
        year: checkpoint.year, month: checkpoint.month, decision_date: decisionDate,
        total_amount: total, cash_account_id: Number(cashAccountId), note: note || null,
      })
      onSaved()
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : 'Pengajuan gagal disimpan.')
    } finally {
      setIsSaving(false)
    }
  }

  const amount = toAmount(total)

  return (
    <Drawer size="md" eyebrow="Bagi Hasil" title={`Ajukan Dividen ${monthNames[checkpoint.month - 1]} ${checkpoint.year}`} description="Direksi yang menyetujui; jurnal terbentuk saat disetujui." onClose={onClose}>
      {error && <InfoNote tone="red">{error}</InfoNote>}

      <InfoNote tone={checkpoint.is_safe ? 'green' : 'amber'}>
        Saldo kas akhir {formatCurrency(toAmount(checkpoint.cash_balance))} · minimum {formatCurrency(toAmount(checkpoint.minimum_cash))} —{' '}
        {checkpoint.is_safe ? 'check point aman.' : 'di bawah minimum cash; pengajuan tetap boleh, keputusannya milik Direksi.'}
        <span className="mt-1 block">Laba bersih bulan ini {formatCurrency(toAmount(checkpoint.net_profit))}.</span>
      </InfoNote>

      <Field label="Total Dividen" required>
        <NumberInput prefix="Rp" value={total} onChange={setTotal} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tanggal Keputusan" required>
          <Input type="date" value={decisionDate} onChange={e => setDecisionDate(e.target.value)} />
        </Field>
        <Field label="Dibayar dari Akun" required>
          <Combobox placeholder="Pilih akun kas/bank..." options={cashAccounts.map(a => ({ value: String(a.id), label: a.label }))} value={cashAccountId} onChange={setCashAccountId} />
        </Field>
      </div>
      <Field label="Catatan">
        <Textarea className="min-h-16" value={note} onChange={e => setNote(e.target.value)} />
      </Field>

      {amount > 0 && activeShareholders.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 text-xs">
          <div className="grid grid-cols-[1fr_60px_1fr_1fr] gap-2 bg-slate-50 px-3 py-2 text-[10px] font-bold uppercase text-slate-500">
            <span>Pemegang Saham</span><span className="text-right">%</span><span className="text-right">Bruto</span><span className="text-right">Net ({formatPercent(taxRate)} pajak)</span>
          </div>
          {activeShareholders.map(s => (
            <div key={s.id} className="grid grid-cols-[1fr_60px_1fr_1fr] gap-2 border-t border-slate-100 px-3 py-2">
              <span className="font-semibold">{s.name}</span>
              <span className="text-right">{formatPercent(s.percentage)}</span>
              <span className="text-right tabular-nums">{formatCurrency(amount * s.percentage)}</span>
              <span className="text-right tabular-nums">{formatCurrency(amount * s.percentage * (1 - taxRate))}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-2 border-t border-slate-200 pt-5">
        <Button variant="ghost" onClick={onClose} disabled={isSaving}>Batal</Button>
        <Button disabled={amount <= 0 || !cashAccountId || isSaving} onClick={() => void save()}>
          {isSaving ? 'Menyimpan...' : 'Ajukan'}
        </Button>
      </div>
    </Drawer>
  )
}
