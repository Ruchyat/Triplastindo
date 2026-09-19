import { useEffect, useState } from 'react'
import {
  Card,
  Combobox,
  Field,
  InfoNote,
  Input,
  NumberInput,
  SectionHeader,
  Textarea,
} from '@/components/common'
import { JournalPreview } from '@/components/financial'
import { Button } from '@/components/ui/Button'
import { toAmount, today } from '@/lib'
import { expenseService } from '@/services/expenseService'
import { ApiError } from '@/services/httpClient'
import type { ApiAccount, ApiExpense } from '@/types'

type Props = {
  expenseAccounts: ApiAccount[]
  cashAccounts: ApiAccount[]
  onCancel: () => void
  onSaved: (expense: ApiExpense) => void
  onDirtyChange?: (isDirty: boolean) => void
}


/**
 * Form bukti pengeluaran.
 *
 * Pengguna memilih akun bebannya langsung — tidak ada kategori perantara —
 * karena daftar bebannya sudah tersusun rapi di COA dan itulah yang akan
 * dibaca di Laba Rugi.
 */
export function ExpenseForm({ expenseAccounts, cashAccounts, onCancel, onSaved, onDirtyChange }: Props) {
  const [date, setDate] = useState(today)
  const [expenseAccountId, setExpenseAccountId] = useState('')
  const [cashAccountId, setCashAccountId] = useState('')
  const [payee, setPayee] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [reference, setReference] = useState('')
  const [note, setNote] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const expenseAccount = expenseAccounts.find(a => String(a.id) === expenseAccountId)
  const cashAccount = cashAccounts.find(a => String(a.id) === cashAccountId)

  const isDirty = Boolean(expenseAccountId || description || toAmount(amount) > 0)
  const isValid =
    Boolean(date) && Boolean(expenseAccountId) && Boolean(cashAccountId) &&
    description.trim() !== '' && toAmount(amount) > 0

  useEffect(() => onDirtyChange?.(isDirty), [isDirty, onDirtyChange])

  async function save() {
    setIsSaving(true)
    setError(null)

    try {
      onSaved(
        await expenseService.create({
          date,
          expense_account_id: Number(expenseAccountId),
          cash_account_id: Number(cashAccountId),
          payee: payee || null,
          description: description.trim(),
          amount,
          reference: reference || null,
          note: note || null,
        }),
      )
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : 'Pengeluaran gagal disimpan. Coba lagi.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
      <div className="space-y-5">
        {error && <InfoNote tone="red">{error}</InfoNote>}

        <Card className="space-y-5 p-5">
          <SectionHeader title="Bukti Pengeluaran" />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tanggal" required>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </Field>
            <Field label="Nominal" required>
              <NumberInput prefix="Rp" placeholder="0" value={amount} onChange={setAmount} />
            </Field>
          </div>

          <Field label="Akun Beban" required>
            <Combobox
              placeholder="Pilih akun beban..."
              options={expenseAccounts.map(account => ({
                value: String(account.id),
                label: account.label,
                description: account.category?.name,
              }))}
              value={expenseAccountId}
              onChange={setExpenseAccountId}
            />
          </Field>

          <Field label="Keterangan" required>
            <Input
              placeholder="Misalnya: Listrik pabrik September"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Penerima Pembayaran">
              <Input placeholder="Nama penerima" value={payee} onChange={e => setPayee(e.target.value)} />
            </Field>
            <Field label="Dibayar dari Akun" required>
              <Combobox
                placeholder="Pilih akun kas/bank..."
                options={cashAccounts.map(account => ({ value: String(account.id), label: account.label }))}
                value={cashAccountId}
                onChange={setCashAccountId}
              />
            </Field>
          </div>
        </Card>

        <Card className="space-y-5 p-5">
          <SectionHeader title="Catatan" />
          <Field label="No. Referensi">
            <Input
              placeholder="Nomor kuitansi, bukti transfer, atau nota"
              value={reference}
              onChange={e => setReference(e.target.value)}
            />
          </Field>
          <Field label="Keterangan Tambahan">
            <Textarea className="min-h-20" value={note} onChange={e => setNote(e.target.value)} />
          </Field>
        </Card>

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={onCancel} disabled={isSaving}>
            Batal
          </Button>
          <Button disabled={!isValid || isSaving} onClick={() => void save()}>
            {isSaving ? 'Menyimpan...' : 'Simpan Pengeluaran'}
          </Button>
        </div>
      </div>

      <div className="h-fit">
        <JournalPreview
          lines={[
            { side: 'D', account: expenseAccount?.label ?? 'Akun beban', amount: toAmount(amount) || undefined },
            { side: 'K', account: cashAccount?.label ?? 'Akun kas/bank', amount: toAmount(amount) || undefined },
          ]}
        />
      </div>
    </div>
  )
}
