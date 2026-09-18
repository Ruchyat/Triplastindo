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
import { Button } from '@/components/ui/Button'
import { ApiError } from '@/services/httpClient'
import { salesService } from '@/services/salesService'
import type { ApiAccount, ApiCustomer, ApiProduct, ApiSalesInvoice, ApiSettlementMethod } from '@/types'
import { formatCurrency } from '@/lib'
import { InvoiceItemsTable } from './InvoiceItemsTable'
import { InvoiceTotals } from './InvoiceTotals'
import { cashAccounts, useSaleInvoiceForm, type SaleInvoiceForm } from './useSaleInvoiceForm'

type Props = {
  customers: ApiCustomer[]
  products: ApiProduct[]
  accounts: ApiAccount[]
  onCancel: () => void
  /** Dipanggil setelah invoice tersimpan. */
  onSaved: (invoice: ApiSalesInvoice) => void
  /** Memberi tahu halaman bahwa ada isian yang belum tersimpan. */
  onDirtyChange?: (isDirty: boolean) => void
}

/**
 * Hanya dua metode: diselesaikan sekarang, atau ditunda.
 *
 * Kas dan bank tidak dipisah di sini — rekening penerimanya sudah dipilih
 * sendiri lewat dropdown akun Kas & Bank di sebelahnya.
 */
const settlementOptions: { value: ApiSettlementMethod; label: string }[] = [
  { value: 'receivable', label: 'Piutang' },
  { value: 'cash', label: 'Tunai' },
]

/**
 * Form pembuatan invoice penjualan.
 *
 * Pengguna mencatat kejadian bisnisnya — siapa membeli apa, berapa, dan
 * dibayar bagaimana — lalu backend yang menerjemahkannya menjadi jurnal.
 * Tidak ada akun debit dan kredit yang perlu dipilih di sini, kecuali akun kas
 * yang benar-benar menerima uangnya.
 *
 * Berbentuk halaman, bukan panel: ini pintu masuk transaksi inti, isiannya
 * panjang, dan kehilangannya karena satu klik di luar panel adalah kerugian
 * nyata.
 */
export function SaleInvoiceForm({
  customers,
  products,
  accounts,
  onCancel,
  onSaved,
  onDirtyChange,
}: Props) {
  const form = useSaleInvoiceForm(products, customers)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const banks = cashAccounts(accounts)

  // Halaman yang menahan kepergian, bukan form ini — form hanya melaporkan
  // apakah sudah ada yang diketik.
  useEffect(() => onDirtyChange?.(form.isDirty), [form.isDirty, onDirtyChange])

  async function save(post: boolean) {
    setIsSaving(true)
    setError(null)

    try {
      const invoice = await salesService.create(form.toPayload(post))
      onSaved(invoice)
    } catch (failure) {
      setError(
        failure instanceof ApiError ? failure.message : 'Invoice gagal disimpan. Coba lagi.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      {error && <InfoNote tone="red">{error}</InfoNote>}

      <Card className="space-y-5 p-5">
        <SectionHeader title="Informasi Invoice" />

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Nomor Dokumen">
          <Input placeholder="Dibuat otomatis" readOnly />
        </Field>
        <Field label="Tanggal" required>
          <Input
            type="date"
            value={form.date}
            onChange={event => form.setDate(event.target.value)}
          />
        </Field>
      </div>

      <Field label="Customer" required>
        <Combobox
          placeholder="Pilih customer..."
          options={customers.map(customer => ({
            value: String(customer.id),
            label: customer.name,
            description: customer.code,
          }))}
          value={form.customerId}
          onChange={form.selectCustomer}
        />
      </Field>

      </Card>

      <Card className="space-y-5 p-5">
        <SectionHeader title="Produk" subtitle="Kuantitas dan harga per satuan; jumlahnya dihitung sistem." />
        <InvoiceItemsTable form={form} />
      </Card>

      <Card className="space-y-5 p-5">
        <SectionHeader title="Pembayaran" />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="PPN Keluaran">
          <NumberInput
            prefix="Rp"
            placeholder="0"
            value={form.taxAmount}
            onChange={form.setTaxAmount}
          />
        </Field>
        <Field label="Metode Pembayaran" required>
          <Combobox
            clearable={false}
            options={settlementOptions}
            value={form.settlement}
            onChange={value => form.setSettlement(value as ApiSettlementMethod)}
          />
        </Field>

      </div>

      {form.availableDeposit > 0 && <DepositChoice form={form} />}

      <div className="grid gap-4 sm:grid-cols-2">
        {form.needsCashAccount && (
          <Field label="Diterima di Akun" required>
            <Combobox
              placeholder="Pilih akun kas/bank..."
              options={banks.map(account => ({ value: String(account.id), label: account.label }))}
              value={form.cashAccountId}
              onChange={form.setCashAccountId}
            />
          </Field>
        )}
      </div>

      {form.isDeferred && (
        <div className="space-y-4 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Termin" required>
              <NumberInput suffix="hari" value={form.termDays} onChange={form.setTermDays} />
            </Field>
            <Field label="DP Diterima">
              <NumberInput
                prefix="Rp"
                placeholder="0"
                value={form.downPayment}
                onChange={form.setDownPayment}
              />
            </Field>
          </div>

          <InvoiceTotals form={form} />
        </div>
      )}

      {!form.isDeferred && <InvoiceTotals form={form} />}

      </Card>

      <Card className="space-y-5 p-5">
        <SectionHeader title="Catatan" />
      <Field label="Keterangan">
        <Textarea
          className="min-h-20"
          placeholder="Keterangan transaksi"
          value={form.note}
          onChange={event => form.setNote(event.target.value)}
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

/**
 * Pilihan pemakaian saldo deposit customer.
 *
 * Tidak otomatis: ada customer yang ingin saldo depositnya tetap utuh dan
 * membayar invoice barunya terpisah. Karena itu saldonya ditampilkan, lalu
 * pencatat yang memutuskan.
 */
function DepositChoice({ form }: { form: SaleInvoiceForm }) {
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
      <label className="flex items-start gap-2.5">
        <input
          type="checkbox"
          checked={form.useDeposit}
          onChange={event => form.setUseDeposit(event.target.checked)}
          className="mt-0.5 size-4 shrink-0"
        />
        <span>
          <b>Gunakan saldo deposit customer</b>
          <span className="mt-1 block leading-5 text-blue-800">
            Saldo tersedia <b>{formatCurrency(form.availableDeposit)}</b>. Bila dipakai, deposit
            memotong invoice lebih dahulu, dan sisanya baru diterima tunai atau menjadi piutang.
          </span>
        </span>
      </label>

      {form.useDeposit && form.appliedDeposit > 0 && (
        <div className="mt-3 flex justify-between border-t border-blue-200 pt-2">
          <span>Deposit yang dipotong</span>
          <b>{formatCurrency(form.appliedDeposit)}</b>
        </div>
      )}
    </div>
  )
}
