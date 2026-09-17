import { X } from 'lucide-react'
import { Input, Select } from '@/components/common'
import { cn } from '@/lib'

const sampleItems = {
  sale: ['Tali', 'Biji Plastik'],
  purchase: ['Karung Polos', 'Bahan Pendukung'],
} as const

/** Baris item dokumen penjualan atau pembelian: produk, kuantitas, dan harga. */
export function LineItemsTable({ type }: { type: 'sale' | 'purchase' }) {
  const items = sampleItems[type]

  return (
    <div className="rounded-xl border border-slate-200">
      <div
        className={cn(
          'grid grid-cols-[1fr_80px_110px_36px] gap-2 rounded-t-xl bg-slate-50 px-3 py-2.5',
          'text-[10px] font-bold uppercase text-slate-500',
        )}
      >
        <span>Produk / Item</span>
        <span>Qty</span>
        <span>Harga</span>
        <span />
      </div>

      {items.map(item => (
        <div
          key={item}
          className="grid grid-cols-[1fr_80px_110px_36px] gap-2 border-t border-slate-100 p-3"
        >
          <Select className="min-w-0">
            <option>{item}</option>
          </Select>
          <Input placeholder="0" />
          <Input placeholder="Rp 0" />
          <button aria-label="Hapus baris" className="text-slate-400 hover:text-rose-600">
            <X size={16} />
          </button>
        </div>
      ))}

      <button className="m-3 text-xs font-bold text-blue-700">+ Tambah Item</button>
    </div>
  )
}
