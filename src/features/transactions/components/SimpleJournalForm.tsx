import { Card, CardHeader, Combobox, Field, Input, NumberInput, Textarea } from '@/components/common'
import { BalanceIndicator } from '@/components/financial'
import { Button } from '@/components/ui/Button'
import { cn, formatCurrency, toAmount } from '@/lib'
import type { ApiAccount } from '@/types'
import type { ManualJournalForm } from '../useManualJournalForm'

type Props = {
  form: ManualJournalForm
  accounts: ApiAccount[]
  isSaving: boolean
  onSave: () => void
}

/**
 * Jurnal penyesuaian dua akun.
 *
 * Dipakai Finance untuk koreksi dan reklasifikasi — bukan jalur utama
 * pencatatan transaksi bisnis. Satu nominal mengisi debit baris pertama dan
 * kredit baris kedua sekaligus, sehingga jurnalnya tidak mungkin timpang.
 */
export function SimpleJournalForm({ form, accounts, isSaving, onSave }: Props) {
  const [debitLine, creditLine] = form.lines
  const amount = debitLine.debit
  const options = accounts.map(account => ({ value: account.code, label: account.label }))

  function setAmount(value: string) {
    form.updateLine(debitLine.key, { debit: value, credit: '' })
    form.updateLine(creditLine.key, { credit: value, debit: '' })
  }

  const preview = [
    { account: accounts.find(a => a.code === debitLine.accountCode), debit: toAmount(amount), credit: 0 },
    { account: accounts.find(a => a.code === creditLine.accountCode), debit: 0, credit: toAmount(amount) },
  ]

  return (
    <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
      <Card>
        <CardHeader title="Detail Jurnal" description="Lengkapi informasi jurnal dan pilih dua akun" />
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <Field label="Tanggal" required>
            <Input type="date" value={form.date} onChange={e => form.setDate(e.target.value)} />
          </Field>
          <Field label="Metode Pembayaran">
            <Input
              placeholder="Transfer, tunai, atau kosongkan"
              value={form.paymentMethod}
              onChange={e => form.setPaymentMethod(e.target.value)}
            />
          </Field>

          <Field label="Akun Debit" required>
            <Combobox
              placeholder="Pilih akun..."
              options={options}
              value={debitLine.accountCode}
              onChange={accountCode => form.updateLine(debitLine.key, { accountCode })}
            />
          </Field>
          <Field label="Akun Kredit" required>
            <Combobox
              placeholder="Pilih akun..."
              options={options}
              value={creditLine.accountCode}
              onChange={accountCode => form.updateLine(creditLine.key, { accountCode })}
            />
          </Field>

          <Field label="Nominal" required>
            <NumberInput prefix="Rp" placeholder="0" value={amount} onChange={setAmount} />
          </Field>
          <Field label="Referensi">
            <Input
              placeholder="No. dokumen / referensi"
              value={debitLine.description}
              onChange={e => {
                form.updateLine(debitLine.key, { description: e.target.value })
                form.updateLine(creditLine.key, { description: e.target.value })
              }}
            />
          </Field>

          <Field label="Keterangan" required className="md:col-span-2">
            <Textarea
              placeholder="Misalnya: Penyesuaian jurnal September 2026"
              value={form.description}
              onChange={e => form.setDescription(e.target.value)}
            />
          </Field>
        </div>
      </Card>

      <Card className="h-fit">
        <CardHeader
          title="Preview Jurnal"
          description="Jurnal dibuat dari data di samping"
          action={<BalanceIndicator difference={form.difference} />}
        />
        <div className="p-5">
          <div className="rounded-xl border border-slate-200">
            <div
              className={cn(
                'grid grid-cols-[1fr_auto_auto] gap-3 bg-slate-50 px-4 py-3',
                'text-[10px] font-bold uppercase text-slate-500',
              )}
            >
              <span>Akun</span>
              <span>Debit</span>
              <span>Kredit</span>
            </div>
            {preview.map((row, index) => (
              <div
                key={index}
                className="grid grid-cols-[1fr_auto_auto] gap-3 border-t border-slate-100 px-4 py-4 text-xs"
              >
                <span className="font-semibold text-slate-800">
                  {row.account?.label ?? <span className="text-slate-400">Belum dipilih</span>}
                </span>
                <span className="w-24 text-right">{row.debit ? formatCurrency(row.debit) : '–'}</span>
                <span className="w-24 text-right">{row.credit ? formatCurrency(row.credit) : '–'}</span>
              </div>
            ))}
          </div>

          <p className="mt-4 rounded-lg bg-blue-50 p-3 text-[11px] leading-5 text-blue-800">
            Penanda arus kas ditentukan sistem dari akun yang dipakai. Nomor jurnal dibuat saat
            jurnal disimpan.
          </p>
          <Button className="mt-5 w-full" disabled={!form.isValid || isSaving} onClick={onSave}>
            {isSaving ? 'Menyimpan...' : 'Simpan Jurnal'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
