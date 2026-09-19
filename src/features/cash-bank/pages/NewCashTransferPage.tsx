import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { routePaths, toPath } from '@/app/router'
import {
  Card,
  Combobox,
  Field,
  InfoNote,
  Input,
  NumberInput,
  PageHeader,
  SectionHeader,
  Textarea,
} from '@/components/common'
import { JournalPreview } from '@/components/financial'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useAsync } from '@/hooks/useAsync'
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges'
import { formatCurrency, toAmount, today } from '@/lib'
import { cashBankService } from '@/services/cashBankService'
import { ApiError } from '@/services/httpClient'


/**
 * Halaman transfer antar akun kas/bank.
 *
 * Tidak menyentuh laba rugi: uang hanya berpindah rekening. Saldo akun asal
 * ditampilkan agar pengguna tahu apakah dananya cukup — backend sendiri tidak
 * melarang saldo negatif, karena pencatatan bisa saja tertinggal dari
 * kejadiannya.
 */
export function NewCashTransferPage() {
  const navigate = useNavigate()
  const [date, setDate] = useState(today)
  const [fromId, setFromId] = useState('')
  const [toId, setToId] = useState('')
  const [amount, setAmount] = useState('')
  const [reference, setReference] = useState('')
  const [note, setNote] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadBalances = useCallback(() => cashBankService.balances(), [])
  const balances = useAsync(loadBalances)
  const accounts = balances.data?.data ?? []

  const from = accounts.find(a => String(a.id) === fromId)
  const to = accounts.find(a => String(a.id) === toId)

  const isDirty = Boolean(fromId || toId || toAmount(amount) > 0)
  const guard = useUnsavedChanges(isDirty)
  const isValid =
    Boolean(date) && Boolean(fromId) && Boolean(toId) && fromId !== toId && toAmount(amount) > 0

  async function save() {
    setIsSaving(true)
    setError(null)
    try {
      const transfer = await cashBankService.createTransfer({
        date,
        from_account_id: Number(fromId),
        to_account_id: Number(toId),
        amount,
        reference: reference || null,
        note: note || null,
      })
      guard.release()
      navigate(toPath.cashTransfer(transfer.id), { replace: true })
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : 'Transfer gagal disimpan. Coba lagi.')
    } finally {
      setIsSaving(false)
    }
  }

  const options = accounts.map(account => ({
    value: String(account.id),
    label: account.label,
    description: `Saldo ${formatCurrency(toAmount(account.balance))}`,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Transaksi / Kas & Bank"
        title="Transfer Antar Akun"
        description="Pindah buku, setor tunai, atau pengisian petty cash"
        actions={
          <Button variant="outline" onClick={() => navigate(routePaths.cashBank)}>
            <ArrowLeft size={16} />
            Kembali
          </Button>
        }
      />

      {balances.error && <InfoNote tone="red">{balances.error}</InfoNote>}
      {error && <InfoNote tone="red">{error}</InfoNote>}

      <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <div className="space-y-5">
          <Card className="space-y-5 p-5">
            <SectionHeader title="Transfer" />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tanggal" required>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
              </Field>
              <Field label="Nominal" required>
                <NumberInput prefix="Rp" placeholder="0" value={amount} onChange={setAmount} />
              </Field>
              <Field label="Dari Akun" required>
                <Combobox placeholder="Pilih akun asal..." options={options} value={fromId} onChange={setFromId} />
              </Field>
              <Field label="Ke Akun" required>
                <Combobox placeholder="Pilih akun tujuan..." options={options} value={toId} onChange={setToId} />
              </Field>
            </div>

            {from && toAmount(amount) > toAmount(from.balance) && (
              <InfoNote tone="amber">
                Nominal melebihi saldo {from.name} yang tercatat ({formatCurrency(toAmount(from.balance))}).
                Transfer tetap dapat disimpan bila pencatatan lain memang belum masuk.
              </InfoNote>
            )}
            {fromId && fromId === toId && (
              <InfoNote tone="red">Akun asal dan tujuan tidak boleh sama.</InfoNote>
            )}
          </Card>

          <Card className="space-y-5 p-5">
            <SectionHeader title="Catatan" />
            <Field label="No. Referensi">
              <Input
                placeholder="Nomor bukti transfer atau slip setoran"
                value={reference}
                onChange={e => setReference(e.target.value)}
              />
            </Field>
            <Field label="Keterangan">
              <Textarea className="min-h-20" value={note} onChange={e => setNote(e.target.value)} />
            </Field>
          </Card>

          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="ghost" onClick={() => navigate(routePaths.cashBank)} disabled={isSaving}>
              Batal
            </Button>
            <Button disabled={!isValid || isSaving} onClick={() => void save()}>
              {isSaving ? 'Menyimpan...' : 'Simpan Transfer'}
            </Button>
          </div>
        </div>

        <div className="h-fit">
          <JournalPreview
            lines={[
              { side: 'D', account: to?.label ?? 'Akun tujuan', amount: toAmount(amount) || undefined },
              { side: 'K', account: from?.label ?? 'Akun asal', amount: toAmount(amount) || undefined },
            ]}
          />
        </div>
      </div>

      {guard.isBlocked && (
        <ConfirmDialog
          title="Tinggalkan transfer ini?"
          description="Isian yang sudah diketik belum tersimpan dan akan hilang."
          confirmLabel="Tinggalkan"
          cancelLabel="Tetap di Sini"
          onCancel={guard.stay}
          onConfirm={guard.proceed}
        />
      )}
    </div>
  )
}
