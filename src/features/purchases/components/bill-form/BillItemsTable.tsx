import { X } from 'lucide-react'
import { Combobox, Input, NumberInput } from '@/components/common'
import { cn, formatCurrency, toAmount } from '@/lib'
import type { ApiProduct } from '@/types'
import type { PurchaseBillForm } from './usePurchaseBillForm'

const stockColumns = 'grid grid-cols-[1fr_100px_70px_150px_120px_36px] gap-2'
const expenseColumns = 'grid grid-cols-[1fr_100px_70px_150px_120px_36px] gap-2'

/**
 * Baris item tagihan pembelian.
 *
 * Bentuknya mengikuti kategori: kategori persediaan meminta produk agar kartu
 * stoknya kelak dapat mengikuti, sedangkan kategori beban cukup keterangan —
 * jasa maintenance dan perlengkapan memang tidak ada di master produk.
 */
export function BillItemsTable({ form, products }: { form: PurchaseBillForm; products: ApiProduct[] }) {
  const columns = form.isStock ? stockColumns : expenseColumns

  return (
    <div className="rounded-xl border border-slate-200">
      <div
        className={cn(
          columns,
          'rounded-t-xl bg-slate-50 px-3 py-2.5 text-[10px] font-bold uppercase text-slate-500',
        )}
      >
        <span>{form.isStock ? 'Produk' : 'Keterangan'}</span>
        <span>Qty</span>
        <span>Satuan</span>
        <span>Harga</span>
        <span className="text-right">Jumlah</span>
        <span />
      </div>

      {form.items.map(item => {
        const amount = toAmount(item.quantity) * toAmount(item.unitPrice)

        return (
          <div key={item.key} className={cn(columns, 'items-center border-t border-slate-100 p-3')}>
            {form.isStock ? (
              <Combobox
                className="min-w-0"
                placeholder="Pilih produk..."
                options={products.map(product => ({
                  value: String(product.id),
                  label: product.name,
                  description: product.code,
                }))}
                value={item.productId}
                onChange={productId => form.updateItem(item.key, { productId })}
              />
            ) : (
              <Input
                placeholder="Keterangan pembelian"
                value={item.description}
                onChange={event => form.updateItem(item.key, { description: event.target.value })}
              />
            )}

            <NumberInput
              decimals={3}
              placeholder="0"
              value={item.quantity}
              onChange={quantity => form.updateItem(item.key, { quantity })}
            />

            <Input
              value={item.unit}
              onChange={event => form.updateItem(item.key, { unit: event.target.value })}
            />

            <NumberInput
              prefix="Rp"
              placeholder="0"
              value={item.unitPrice}
              onChange={unitPrice => form.updateItem(item.key, { unitPrice })}
            />

            <span className="text-right text-xs font-semibold tabular-nums text-slate-700">
              {amount > 0 ? formatCurrency(amount) : '–'}
            </span>

            <button
              type="button"
              aria-label="Hapus baris"
              onClick={() => form.removeItem(item.key)}
              className="text-slate-400 hover:text-rose-600 disabled:opacity-30"
              disabled={form.items.length === 1}
            >
              <X size={16} />
            </button>
          </div>
        )
      })}

      <button type="button" onClick={form.addItem} className="m-3 text-xs font-bold text-blue-700">
        + Tambah Item
      </button>
    </div>
  )
}
