import { X } from 'lucide-react'
import { Input, Select } from '@/components/common'
import { cn, formatCurrency, toAmount } from '@/lib'
import type { ApiProduct } from '@/types'
import type { SaleInvoiceForm } from './useSaleInvoiceForm'

const columns = 'grid grid-cols-[1fr_90px_120px_110px_36px] gap-2'

/** Baris produk invoice: produk, kuantitas, harga, dan jumlahnya. */
export function InvoiceItemsTable({ form }: { form: SaleInvoiceForm }) {
  return (
    <div className="rounded-xl border border-slate-200">
      <div
        className={cn(
          columns,
          'rounded-t-xl bg-slate-50 px-3 py-2.5 text-[10px] font-bold uppercase text-slate-500',
        )}
      >
        <span>Produk</span>
        <span>Qty</span>
        <span>Harga / Satuan</span>
        <span className="text-right">Jumlah</span>
        <span />
      </div>

      {form.items.map(item => (
        <ItemRow key={item.key} item={item} form={form} products={form.sellableProducts} />
      ))}

      <button type="button" onClick={form.addItem} className="m-3 text-xs font-bold text-blue-700">
        + Tambah Item
      </button>
    </div>
  )
}

type RowProps = {
  item: SaleInvoiceForm['items'][number]
  form: SaleInvoiceForm
  products: ApiProduct[]
}

function ItemRow({ item, form, products }: RowProps) {
  const amount = toAmount(item.quantity) * toAmount(item.unitPrice)
  const unit = products.find(product => String(product.id) === item.productId)?.unit ?? 'Kg'

  return (
    <div className={cn(columns, 'items-center border-t border-slate-100 p-3')}>
      <Select
        className="min-w-0"
        value={item.productId}
        onChange={event => form.updateItem(item.key, { productId: event.target.value })}
      >
        <option value="">Pilih produk...</option>
        {products.map(product => (
          <option key={product.id} value={product.id}>
            {product.name}
          </option>
        ))}
      </Select>

      <Input
        type="number"
        min="0"
        step="0.001"
        placeholder={unit}
        value={item.quantity}
        onChange={event => form.updateItem(item.key, { quantity: event.target.value })}
      />

      <Input
        type="number"
        min="0"
        placeholder="Rp 0"
        value={item.unitPrice}
        onChange={event => form.updateItem(item.key, { unitPrice: event.target.value })}
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
}
