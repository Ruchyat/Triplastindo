import { Field, InfoNote, Select } from '@/components/common'
import { expenseCategories } from '@/mocks/expenses'
import type { DocumentType } from '@/types'

/** Pemilihan customer atau supplier pada dokumen penjualan dan pembelian. */
export function TradePartyField({ type }: { type: 'sale' | 'purchase' }) {
  const isSale = type === 'sale'
  return (
    <Field label={isSale ? 'Customer' : 'Supplier'} required>
      <Select className="w-full">
        <option>Pilih {isSale ? 'customer' : 'supplier'}...</option>
        <option>
          {isSale
            ? 'PT Tali Nusantara · Piutang Rp 218.625.000'
            : 'PT Sumber Plastik · Utang Rp 455.000.000'}
        </option>
        <option>
          {isSale ? 'UD Makmur Jaya · Deposit Rp 10.000.000' : 'CV Teknik Makmur · Lunas'}
        </option>
      </Select>
    </Field>
  )
}

/** Pemilihan customer untuk penerimaan dan pengembalian deposit. */
export function DepositPartyFields({ isRefund }: { isRefund: boolean }) {
  return (
    <>
      <Field label="Customer" required>
        <Select className="w-full">
          <option>Pilih customer...</option>
          <option>PT Tali Nusantara · Saldo Rp 75.000.000</option>
          <option>CV Berkah Plastik · Saldo Rp 42.500.000</option>
        </Select>
      </Field>
      {isRefund && (
        <InfoNote tone="amber">
          Saldo deposit tersedia: <b>Rp 75.000.000</b>
        </InfoNote>
      )}
    </>
  )
}

/** Penerima pembayaran dan kategori biaya pada bukti pengeluaran. */
export function ExpenseFields() {
  return (
    <>
      <Field label="Penerima Pembayaran">
        <input className="field" placeholder="Nama penerima" />
      </Field>
      <Field label="Kategori Biaya" required>
        <Select className="w-full">
          {expenseCategories.map(category => (
            <option key={category}>{category}</option>
          ))}
        </Select>
      </Field>
    </>
  )
}

/** Akun asal dan tujuan pada transfer antar rekening. */
export function TransferFields() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Dari Akun">
        <Select className="w-full">
          <option>Bank BCA</option>
        </Select>
      </Field>
      <Field label="Ke Akun">
        <Select className="w-full">
          <option>Petty Cash</option>
        </Select>
      </Field>
    </div>
  )
}

/**
 * Dokumen asal yang akan dilunasi.
 *
 * Pembayaran selalu ditautkan ke invoice atau tagihan supaya utang dan
 * piutang berkurang tanpa input ulang.
 */
export function SettlementDocumentField({ type }: { type: Extract<DocumentType, 'receipt' | 'payment'> }) {
  const isReceipt = type === 'receipt'
  return (
    <Field label={isReceipt ? 'Invoice Penjualan' : 'Tagihan Pembelian'} required>
      <Select className="w-full">
        <option>Pilih dokumen yang akan dibayar...</option>
        <option>
          {isReceipt ? 'INV/2026/09/018 · PT Tali Nusantara' : 'PUR/2026/09/024 · PT Sumber Plastik'}
        </option>
      </Select>
    </Field>
  )
}
