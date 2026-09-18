import { Plus, Trash2 } from 'lucide-react'
import {
  Card,
  CardHeader,
  Combobox,
  Field,
  InfoNote,
  Input,
  NumberInput,
  TableWrap,
} from '@/components/common'
import { BalanceIndicator } from '@/components/financial'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib'
import type { ApiAccount } from '@/types'
import type { ManualJournalForm } from '../useManualJournalForm'

type Props = {
  form: ManualJournalForm
  accounts: ApiAccount[]
  isSaving: boolean
  onSave: () => void
}

/**
 * Jurnal majemuk untuk transaksi yang melibatkan lebih dari dua akun.
 *
 * Jurnal hanya boleh tersimpan ketika total debit sama dengan total kredit.
 */
export function CompoundJournalForm({ form, accounts, isSaving, onSave }: Props) {
  const options = accounts.map(account => ({ value: account.code, label: account.label }))

  return (
    <Card>
      <CardHeader
        title="Jurnal Majemuk"
        description="Tambahkan beberapa baris debit dan kredit"
        action={<BalanceIndicator difference={form.difference} />}
      />

      <div className="grid gap-4 p-5 md:grid-cols-3">
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
        <Field label="Keterangan" required>
          <Input
            placeholder="Keterangan jurnal"
            value={form.description}
            onChange={e => form.setDescription(e.target.value)}
          />
        </Field>
      </div>

      {form.hasTwoSidedLine && (
        <div className="px-5 pb-4">
          <InfoNote tone="amber">
            Satu baris hanya boleh mengisi debit <b>atau</b> kredit, bukan keduanya.
          </InfoNote>
        </div>
      )}

      <TableWrap>
        <thead>
          <tr>
            <th>Akun</th>
            <th>Keterangan</th>
            <th className="text-right">Debit</th>
            <th className="text-right">Kredit</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {form.lines.map(line => (
            <tr key={line.key}>
              <td>
                <Combobox
                  className="w-72"
                  placeholder="Pilih akun..."
                  options={options}
                  value={line.accountCode}
                  onChange={accountCode => form.updateLine(line.key, { accountCode })}
                />
              </td>
              <td>
                <Input
                  placeholder="Keterangan baris"
                  value={line.description}
                  onChange={e => form.updateLine(line.key, { description: e.target.value })}
                />
              </td>
              <td>
                <NumberInput
                  className="min-w-40"
                  prefix="Rp"
                  placeholder="0"
                  value={line.debit}
                  onChange={debit => form.updateLine(line.key, { debit })}
                />
              </td>
              <td>
                <NumberInput
                  className="min-w-40"
                  prefix="Rp"
                  placeholder="0"
                  value={line.credit}
                  onChange={credit => form.updateLine(line.key, { credit })}
                />
              </td>
              <td>
                <button
                  type="button"
                  aria-label="Hapus baris"
                  className="text-slate-400 hover:text-rose-600 disabled:opacity-30"
                  disabled={form.lines.length <= 2}
                  onClick={() => form.removeLine(line.key)}
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </TableWrap>

      <div className="flex flex-col justify-between gap-4 border-t border-slate-100 p-5 sm:flex-row sm:items-end">
        <Button variant="outline" onClick={form.addLine}>
          <Plus size={16} />
          Tambah Baris
        </Button>

        <div className="flex flex-wrap items-end gap-6">
          <div className="grid grid-cols-3 gap-6 text-right text-xs">
            <TotalCell label="Total Debit" value={formatCurrency(form.totals.debit)} />
            <TotalCell label="Total Kredit" value={formatCurrency(form.totals.credit)} />
            <TotalCell
              label="Selisih"
              value={formatCurrency(form.difference)}
              tone={form.difference === 0 ? 'text-emerald-700' : 'text-rose-600'}
            />
          </div>
          <Button disabled={!form.isValid || isSaving} onClick={onSave}>
            {isSaving ? 'Menyimpan...' : 'Simpan Jurnal'}
          </Button>
        </div>
      </div>
    </Card>
  )
}

function TotalCell({
  label,
  value,
  tone = 'text-slate-900',
}: {
  label: string
  value: string
  tone?: string
}) {
  return (
    <div>
      <p className="text-slate-500">{label}</p>
      <b className={`mt-1 block ${tone}`}>{value}</b>
    </div>
  )
}
