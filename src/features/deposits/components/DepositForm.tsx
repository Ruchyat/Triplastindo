import { useEffect, useState } from 'react'
import { Card, Combobox, Field, InfoNote, Input, NumberInput, Textarea } from '@/components/common'
import { Button } from '@/components/ui/Button'
import { formatCurrency, toAmount, today } from '@/lib'
import { depositService } from '@/services/depositService'
import { ApiError } from '@/services/httpClient'
import type { ApiAccount, ApiCustomer } from '@/types'

type Props = {
  /** `received` menerima titipan, `refunded` mengembalikannya. */
  movement: 'received' | 'refunded'
  customers: ApiCustomer[]
  accounts: ApiAccount[]
  /** Customer yang sudah ditentukan, bila form dibuka dari kartu depositnya. */
  initialCustomerId?: number
  onCancel: () => void
  onSaved: (customerId: number) => void
  onDirtyChange?: (isDirty: boolean) => void
}

const copy = {
  received: {
    title: 'Terima Deposit Pelanggan',
    description: 'Uang titipan dicatat sebagai kewajiban, bukan pendapatan.',
    action: 'Simpan Deposit',
    amountLabel: 'Nilai Deposit',
    accountLabel: 'Diterima di Akun',
  },
  refunded: {
    title: 'Kembalikan Deposit Pelanggan',
    description: 'Saldo deposit berkurang, dan uangnya keluar dari kas atau bank.',
    action: 'Simpan Pengembalian',
    amountLabel: 'Nilai Pengembalian',
    accountLabel: 'Dikembalikan dari Akun',
  },
} as const

/**
 * Form penerimaan dan pengembalian deposit pelanggan.
 *
 * Deposit dapat diterima tanpa invoice lebih dahulu — itulah sebabnya modul
 * ini berdiri sendiri dan tidak menjadi bagian form penjualan.
 */
export function DepositForm({
  movement,
  customers,
  accounts,
  initialCustomerId,
  onCancel,
  onSaved,
  onDirtyChange,
}: Props) {
  const text = copy[movement]

  const [date, setDate] = useState(today)
  const [customerId, setCustomerId] = useState(initialCustomerId ? String(initialCustomerId) : '')
  const [amount, setAmount] = useState('')
  const [cashAccountId, setCashAccountId] = useState('')
  const [reference, setReference] = useState('')
  const [note, setNote] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const customer = customers.find(candidate => String(candidate.id) === customerId)
  const balance = toAmount(customer?.deposit_balance)
  const isOverRefund = movement === 'refunded' && toAmount(amount) > balance

  const isValid =
    Boolean(date) && Boolean(customerId) && Boolean(cashAccountId) && toAmount(amount) > 0 && !isOverRefund

  async function save() {
    setIsSaving(true)
    setError(null)

    try {
      await depositService.create({
        date,
        customer_id: Number(customerId),
        movement,
        amount,
        cash_account_id: Number(cashAccountId),
        reference: reference || null,
        note: note || null,
      })
      onSaved(Number(customerId))
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : 'Deposit gagal disimpan. Coba lagi.')
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => onDirtyChange?.(Boolean(customerId) || toAmount(amount) > 0), [
    customerId,
    amount,
    onDirtyChange,
  ])

  return (
    <Card className="max-w-2xl space-y-5 p-5">
      {error && <InfoNote tone="red">{error}</InfoNote>}

      <Field label="Tanggal" required>
        <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
      </Field>

      <Field label="Customer" required>
        <Combobox
          placeholder="Pilih customer..."
          options={customers.map(item => ({
            value: String(item.id),
            label: item.name,
            description: item.code,
          }))}
          value={customerId}
          onChange={setCustomerId}
          disabled={initialCustomerId !== undefined}
        />
      </Field>

      {customer && (
        <InfoNote tone={isOverRefund ? 'red' : 'blue'}>
          Saldo deposit {customer.name} saat ini <b>{formatCurrency(balance)}</b>
          {isOverRefund && ' — tidak cukup untuk pengembalian sebesar itu.'}
        </InfoNote>
      )}

      <Field label={text.amountLabel} required>
        <NumberInput prefix="Rp" placeholder="0" value={amount} onChange={setAmount} />
      </Field>

      <Field label={text.accountLabel} required>
        <Combobox
          placeholder="Pilih akun kas/bank..."
          options={accounts.map(account => ({ value: String(account.id), label: account.label }))}
          value={cashAccountId}
          onChange={setCashAccountId}
        />
      </Field>

      <Field label="No. Referensi">
        <Input
          placeholder="Nomor bukti transfer atau kuitansi"
          value={reference}
          onChange={e => setReference(e.target.value)}
        />
      </Field>

      <Field label="Keterangan">
        <Textarea
          className="min-h-20"
          placeholder="Keterangan mutasi deposit"
          value={note}
          onChange={e => setNote(e.target.value)}
        />
      </Field>

      <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-5">
        <Button variant="ghost" onClick={onCancel} disabled={isSaving}>
          Batal
        </Button>
        <Button disabled={!isValid || isSaving} onClick={() => void save()}>
          {isSaving ? 'Menyimpan...' : text.action}
        </Button>
      </div>
    </Card>
  )
}
