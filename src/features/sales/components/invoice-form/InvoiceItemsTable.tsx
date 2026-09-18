import { X } from 'lucide-react'
import { Combobox, NumberInput } from '@/components/common'
import { cn, formatCurrency, toAmount } from '@/lib'
import type { ApiProduct } from '@/types'
import type { SaleInvoiceForm } from './useSaleInvoiceForm'

const columns = 'grid grid-cols-[1fr_110px_150px_120px_36px] gap-2'

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

      <NumberInput
        decimals={3}
        suffix={unit}
        placeholder="0"
        value={item.quantity}
        onChange={quantity => form.updateItem(item.key, { quantity })}
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
}
