import { useCallback, useEffect, useState } from 'react'
import { Card, Field, InfoNote, Input, SectionHeader, Select, Textarea } from '@/components/common'
import { Button } from '@/components/ui/Button'
import { useAsync } from '@/hooks/useAsync'
import { formatCurrency } from '@/lib'
import { ApiError } from '@/services/httpClient'
import { receiptService } from '@/services/receiptService'
import { salesService } from '@/services/salesService'
import type { ApiAccount, ApiCustomer } from '@/types'
import { OutstandingInvoiceList } from './OutstandingInvoiceList'
import { useReceiptForm } from './useReceiptForm'

type Props = {
  customers: ApiCustomer[]
  accounts: ApiAccount[]
  /** Customer dan invoice yang sudah ditentukan, bila dibuka dari detail invoice. */
  initialCustomerId?: number
  initialInvoiceId?: number
  onCancel: () => void
  onSaved: (receiptId: number) => void
  onDirtyChange?: (isDirty: boolean) => void
}

/**
 * Form pencatatan penerimaan pembayaran dari customer.
 *
 * Halaman penuh, sama seperti form invoice: mencatat pelunasan adalah
 * transaksi, bukan tindakan sampingan.
 *
 * Satu bukti dapat melunasi beberapa invoice sekaligus, karena customer
 * umumnya mentransfer satu jumlah untuk beberapa tagihan. Nilai buktinya
 * dijumlahkan dari pelunasan tiap invoice, bukan diketik terpisah.
 */
export function ReceiptForm({
  customers,
  accounts,
  initialCustomerId,
  initialInvoiceId,
  onCancel,
  onSaved,
  onDirtyChange,
}: Props) {
  const [customerId, setCustomerId] = useState(initialCustomerId ? String(initialCustomerId) : '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Hanya invoice milik customer terpilih yang masih menyisakan piutang.
  const loadOutstanding = useCallback(
    () =>
      customerId
        ? salesService.list({ customerId: Number(customerId), status: undefined, perPage: 100 })
        : Promise.resolve(null),
    [customerId],
  )
  const invoices = useAsync(loadOutstanding)

  const outstanding = (invoices.data?.data ?? []).filter(
    invoice => invoice.status === 'unpaid' || invoice.status === 'partial',
  )

  const form = useReceiptForm(outstanding, initialInvoiceId)

  async function save() {
    setIsSaving(true)
    setError(null)

    try {
      const receipt = await receiptService.create(form.toPayload(Number(customerId)))
      onSaved(receipt.id)
    } catch (failure) {
      setError(
        failure instanceof ApiError ? failure.message : 'Penerimaan gagal disimpan. Coba lagi.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => onDirtyChange?.(form.selectedCount > 0), [form.selectedCount, onDirtyChange])

  return (
    <div className="space-y-5">
      {error && <InfoNote tone="red">{error}</InfoNote>}

      <Card className="space-y-5 p-5">
        <SectionHeader title="Penerimaan" />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tanggal" required>
          <Input type="date" value={form.date} onChange={e => form.setDate(e.target.value)} />
        </Field>
        <Field label="Diterima di Akun" required>
          <Select
            className="w-full"
            value={form.cashAccountId}
            onChange={e => form.setCashAccountId(e.target.value)}
          >
            <option value="">Pilih akun kas/bank...</option>
            {accounts.map(account => (
              <option key={account.id} value={account.id}>
                {account.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Customer" required>
        <Select
          className="w-full"
          value={customerId}
          onChange={e => setCustomerId(e.target.value)}
          disabled={initialCustomerId !== undefined}
        >
          <option value="">Pilih customer...</option>
          {customers.map(customer => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
            </option>
          ))}
        </Select>
      </Field>

      </Card>

      <Card className="space-y-5 p-5">
        <SectionHeader
          title="Invoice yang Dibayar"
          subtitle="Mencentang sebuah invoice mengisi nilainya penuh sesuai sisa piutang; nilainya tetap dapat diubah untuk pembayaran sebagian."
        />
        {customerId ? (
          <OutstandingInvoiceList invoices={outstanding} form={form} />
        ) : (
          <p className="text-xs text-slate-500">Pilih customer terlebih dahulu.</p>
        )}
      </Card>

      <Card className="space-y-5 p-5">
        <SectionHeader title="Catatan" />

      <Field label="No. Referensi">
        <Input
          placeholder="Nomor bukti transfer, cek, atau giro"
          value={form.reference}
          onChange={e => form.setReference(e.target.value)}
        />
      </Field>

      <Field label="Keterangan">
        <Textarea
          className="min-h-20"
          placeholder="Keterangan penerimaan"
          value={form.note}
          onChange={e => form.setNote(e.target.value)}
        />
      </Field>

      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-900 p-4 text-white">
        <span className="text-[11px] text-slate-400">
          Total Diterima · {form.selectedCount} invoice
        </span>
        <b className="text-lg">{formatCurrency(form.total)}</b>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="ghost" onClick={onCancel} disabled={isSaving}>
          Batal
        </Button>
        <Button disabled={!form.isValid || isSaving} onClick={() => void save()}>
          {isSaving ? 'Menyimpan...' : 'Simpan Penerimaan'}
        </Button>
      </div>
    </div>
  )
}
