import { useCallback, useEffect, useState } from 'react'
import { Card, Combobox, Field, InfoNote, Input, SectionHeader, Textarea } from '@/components/common'
import { Button } from '@/components/ui/Button'
import { useAsync } from '@/hooks/useAsync'
import { formatCurrency } from '@/lib'
import { ApiError } from '@/services/httpClient'
import { purchaseService } from '@/services/purchaseService'
import { supplierPaymentService } from '@/services/supplierPaymentService'
import type { ApiAccount, ApiSupplier } from '@/types'
import { OutstandingBillList } from './OutstandingBillList'
import { useSupplierPaymentForm } from './useSupplierPaymentForm'

type Props = {
  suppliers: ApiSupplier[]
  accounts: ApiAccount[]
  /** Supplier dan tagihan yang sudah ditentukan, bila dibuka dari detail tagihan. */
  initialSupplierId?: number
  initialBillId?: number
  onCancel: () => void
  onSaved: (paymentId: number) => void
  onDirtyChange?: (isDirty: boolean) => void
}

/**
 * Form pencatatan pembayaran kepada supplier.
 *
 * Cermin form penerimaan pembayaran: satu bukti dapat melunasi beberapa
 * tagihan sekaligus, dan nilai buktinya dijumlahkan dari pelunasan tiap
 * tagihan, bukan diketik terpisah.
 */
export function SupplierPaymentForm({
  suppliers,
  accounts,
  initialSupplierId,
  initialBillId,
  onCancel,
  onSaved,
  onDirtyChange,
}: Props) {
  const [supplierId, setSupplierId] = useState(initialSupplierId ? String(initialSupplierId) : '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Hanya tagihan milik supplier terpilih yang masih menyisakan utang.
  const loadOutstanding = useCallback(
    () =>
      supplierId
        ? purchaseService.list({ supplierId: Number(supplierId), perPage: 100 })
        : Promise.resolve(null),
    [supplierId],
  )
  const bills = useAsync(loadOutstanding)

  const outstanding = (bills.data?.data ?? []).filter(
    bill => bill.status === 'unpaid' || bill.status === 'partial',
  )

  const form = useSupplierPaymentForm(outstanding, initialBillId)

  async function save() {
    setIsSaving(true)
    setError(null)

    try {
      const payment = await supplierPaymentService.create(form.toPayload(Number(supplierId)))
      onSaved(payment.id)
    } catch (failure) {
      setError(
        failure instanceof ApiError ? failure.message : 'Pembayaran gagal disimpan. Coba lagi.',
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
        <SectionHeader title="Pembayaran" />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tanggal" required>
            <Input type="date" value={form.date} onChange={e => form.setDate(e.target.value)} />
          </Field>
          <Field label="Dibayar dari Akun" required>
            <Combobox
              placeholder="Pilih akun kas/bank..."
              options={accounts.map(account => ({ value: String(account.id), label: account.label }))}
              value={form.cashAccountId}
              onChange={form.setCashAccountId}
            />
          </Field>
        </div>

        <Field label="Supplier" required>
          <Combobox
            placeholder="Pilih supplier..."
            options={suppliers.map(supplier => ({
              value: String(supplier.id),
              label: supplier.name,
              description: supplier.code,
            }))}
            value={supplierId}
            onChange={setSupplierId}
            disabled={initialSupplierId !== undefined}
          />
        </Field>
      </Card>

      <Card className="space-y-5 p-5">
        <SectionHeader
          title="Tagihan yang Dibayar"
          subtitle="Mencentang sebuah tagihan mengisi nilainya penuh sesuai sisa utang; nilainya tetap dapat diubah untuk pembayaran sebagian."
        />
        {supplierId ? (
          <OutstandingBillList bills={outstanding} form={form} />
        ) : (
          <p className="text-xs text-slate-500">Pilih supplier terlebih dahulu.</p>
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
            placeholder="Keterangan pembayaran"
            value={form.note}
            onChange={e => form.setNote(e.target.value)}
          />
        </Field>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-900 p-4 text-white">
        <span className="text-[11px] text-slate-400">
          Total Dibayar · {form.selectedCount} tagihan
        </span>
        <b className="text-lg">{formatCurrency(form.total)}</b>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="ghost" onClick={onCancel} disabled={isSaving}>
          Batal
        </Button>
        <Button disabled={!form.isValid || isSaving} onClick={() => void save()}>
          {isSaving ? 'Menyimpan...' : 'Simpan Pembayaran'}
        </Button>
      </div>
    </div>
  )
}
