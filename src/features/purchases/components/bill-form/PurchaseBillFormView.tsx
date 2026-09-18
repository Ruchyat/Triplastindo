import { useEffect, useState } from 'react'
import { Card, Field, InfoNote, Input, SectionHeader, Select, Textarea } from '@/components/common'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDate } from '@/lib'
import { ApiError } from '@/services/httpClient'
import { purchaseService } from '@/services/purchaseService'
import type {
  ApiAccount,
  ApiProduct,
  ApiPurchaseBill,
  ApiPurchaseCategory,
  ApiPurchaseSettlement,
  ApiSupplier,
} from '@/types'
import { BillItemsTable } from './BillItemsTable'
import { CategoryChoice } from './CategoryChoice'
import { usePurchaseBillForm } from './usePurchaseBillForm'

type Props = {
  suppliers: ApiSupplier[]
  products: ApiProduct[]
  categories: ApiPurchaseCategory[]
  /** Akun Kas & Bank untuk pembayaran. */
  cashAccounts: ApiAccount[]
  /** Seluruh akun aktif, untuk kategori yang akunnya dipilih sendiri. */
  allAccounts: ApiAccount[]
  onCancel: () => void
  onSaved: (bill: ApiPurchaseBill) => void
  onDirtyChange?: (isDirty: boolean) => void
}

const settlementOptions: { value: ApiPurchaseSettlement; label: string }[] = [
  { value: 'payable', label: 'Utang' },
  { value: 'cash', label: 'Tunai' },
]

/**
 * Form pembuatan tagihan pembelian.
 *
 * Bentuknya mengikuti kategori: kategori persediaan meminta produk pada tiap
 * baris, kategori beban cukup keterangan, dan kategori Lainnya meminta akunnya
 * dipilih sendiri.
 */
export function PurchaseBillFormView({
  suppliers,
  products,
  categories,
  cashAccounts,
  allAccounts,
  onCancel,
  onSaved,
  onDirtyChange,
}: Props) {
  const form = usePurchaseBillForm(categories, products, suppliers)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => onDirtyChange?.(form.isDirty), [form.isDirty, onDirtyChange])

  async function save(post: boolean) {
    setIsSaving(true)
    setError(null)

    try {
      onSaved(await purchaseService.create(form.toPayload(post)))
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : 'Tagihan gagal disimpan. Coba lagi.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      {error && <InfoNote tone="red">{error}</InfoNote>}

      <Card className="space-y-5 p-5">
        <SectionHeader title="Informasi Tagihan" />

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Nomor Dokumen">
            <Input placeholder="Dibuat otomatis" readOnly />
          </Field>
          <Field label="Tanggal" required>
            <Input type="date" value={form.date} onChange={e => form.setDate(e.target.value)} />
          </Field>
          <Field label="No. Nota Supplier">
            <Input
              placeholder="Nomor nota dari supplier"
              value={form.supplierInvoiceNumber}
              onChange={e => form.setSupplierInvoiceNumber(e.target.value)}
            />
          </Field>
        </div>

        <Field label="Supplier" required>
          <Select
            className="w-full"
            value={form.supplierId}
            onChange={e => form.selectSupplier(e.target.value)}
          >
            <option value="">Pilih supplier...</option>
            {suppliers.map(supplier => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </Select>
        </Field>

        <CategoryChoice form={form} accounts={allAccounts} />
      </Card>

      <Card className="space-y-5 p-5">
        <SectionHeader
          title="Item"
          subtitle={
            form.category
              ? form.isStock
                ? 'Kategori persediaan: setiap baris menunjuk produk.'
                : 'Kategori beban: setiap baris cukup keterangan.'
              : 'Pilih kategori terlebih dahulu.'
          }
        />
        {form.category ? (
          <BillItemsTable form={form} products={products} />
        ) : (
          <p className="text-xs text-slate-500">Bentuk barisnya mengikuti kategori pembelian.</p>
        )}
      </Card>

      <Card className="space-y-5 p-5">
        <SectionHeader title="Pembayaran" />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="PPN Masukan">
            <Input
              type="number"
              min="0"
              placeholder="0"
              value={form.taxAmount}
              onChange={e => form.setTaxAmount(e.target.value)}
            />
          </Field>
          <Field label="Metode Pembayaran" required>
            <Select
              className="w-full"
              value={form.settlement}
              onChange={e => form.setSettlement(e.target.value as ApiPurchaseSettlement)}
            >
              {settlementOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {form.needsCashAccount && (
          <Field label="Dibayar dari Akun" required>
            <Select
              className="w-full"
              value={form.cashAccountId}
              onChange={e => form.setCashAccountId(e.target.value)}
            >
              <option value="">Pilih akun kas/bank...</option>
              {cashAccounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.label}
                </option>
              ))}
            </Select>
          </Field>
        )}

        {form.isDeferred && (
          <div className="space-y-4 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Termin (hari)" required>
                <Input
                  type="number"
                  min="0"
                  value={form.termDays}
                  onChange={e => form.setTermDays(e.target.value)}
                />
              </Field>
              <Field label="DP Dibayar">
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.downPayment}
                  onChange={e => form.setDownPayment(e.target.value)}
                />
              </Field>
            </div>
            {form.dueDate && (
              <p className="text-[11px] text-slate-500">
                Jatuh tempo <b>{formatDate(form.dueDate)}</b>, {form.termDays} hari sejak tanggal
                tagihan.
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 rounded-lg bg-slate-900 p-3 text-white">
          <Totals label="Total Tagihan" value={form.total} />
          <Totals label={form.isDeferred ? 'DP Dibayar' : 'Dibayar Sekarang'} value={form.paidNow || (form.isDeferred ? 0 : form.total)} />
          <Totals label="Sisa Utang" value={form.isDeferred ? form.payable : 0} />
        </div>
      </Card>

      <Card className="space-y-5 p-5">
        <SectionHeader title="Catatan" />
        <Field label="Keterangan">
          <Textarea
            className="min-h-20"
            placeholder="Keterangan tagihan"
            value={form.note}
            onChange={e => form.setNote(e.target.value)}
          />
        </Field>
      </Card>

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="ghost" onClick={onCancel} disabled={isSaving}>
          Batal
        </Button>
        <Button variant="outline" disabled={!form.isValid || isSaving} onClick={() => void save(false)}>
          Simpan Draft
        </Button>
        <Button disabled={!form.isValid || isSaving} onClick={() => void save(true)}>
          {isSaving ? 'Menyimpan...' : 'Simpan & Posting'}
        </Button>
      </div>
    </div>
  )
}

function Totals({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-[9px] text-slate-400">{label}</p>
      <b className="text-xs">{formatCurrency(value)}</b>
    </div>
  )
}
