import { Field, Input, Select } from '@/components/common'
import { formatCurrency } from '@/lib'
import type { DocumentFormState } from './useDocumentForm'

type Props = {
  /** Blok DP dan deposit hanya berlaku untuk invoice penjualan kredit. */
  isSale: boolean
  form: DocumentFormState
}

/**
 * Termin, jatuh tempo, DP, dan potongan deposit untuk dokumen kredit.
 *
 * Bagian ini hanya muncul ketika metode pembayarannya Piutang atau Utang.
 */
export function DeferredPaymentFields({ isSale, form }: Props) {
  return (
    <div className="space-y-4 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Termin" required>
          <Select className="w-full">
            <option>30 Hari</option>
            <option>14 Hari</option>
            <option>45 Hari</option>
          </Select>
        </Field>
        <Field label="Jatuh Tempo" required>
          <Input type="date" />
        </Field>
      </div>

      {isSale && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="DP Diterima">
              <Input
                type="number"
                placeholder="0"
                value={form.downPayment || ''}
                onChange={event => form.setDownPayment(Number(event.target.value) || 0)}
              />
            </Field>
            <Field label="Diterima Melalui">
              <Select
                className="w-full"
                value={form.downPaymentChannel}
                onChange={event => form.setDownPaymentChannel(event.target.value as 'Bank' | 'Cash')}
              >
                <option>Bank</option>
                <option>Cash</option>
              </Select>
            </Field>
          </div>

          <DepositNotice appliedDeposit={form.appliedDeposit} />
          <InvoiceTotals form={form} />
        </>
      )}
    </div>
  )
}

/** Penjelasan aturan potong-deposit-otomatis beserta nilai yang diterapkan. */
function DepositNotice({ appliedDeposit }: { appliedDeposit: number }) {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
      <b>Deposit customer dipotong otomatis</b>
      <p className="mt-1 leading-5">
        Jika customer memiliki saldo deposit, sistem akan menggunakannya terlebih dahulu pada
        invoice ini. Customer tidak dapat memiliki saldo deposit dan piutang terbuka secara
        bersamaan.
      </p>
      <div className="mt-2 flex justify-between border-t border-blue-200 pt-2">
        <span>Deposit yang diterapkan otomatis</span>
        <b>{formatCurrency(appliedDeposit)}</b>
      </div>
    </div>
  )
}

/** Ringkasan total invoice, uang yang sudah diterima, dan sisa piutang. */
function InvoiceTotals({ form }: { form: DocumentFormState }) {
  const totals = [
    { label: 'Total Invoice', value: form.total },
    { label: 'DP + Deposit', value: form.downPayment + form.appliedDeposit },
    { label: 'Sisa Piutang', value: form.remainingReceivable },
  ]

  return (
    <div className="grid grid-cols-3 gap-3 rounded-lg bg-slate-900 p-3 text-white">
      {totals.map(total => (
        <div key={total.label}>
          <p className="text-[9px] text-slate-400">{total.label}</p>
          <b className="text-xs">{formatCurrency(total.value)}</b>
        </div>
      ))}
    </div>
  )
}
