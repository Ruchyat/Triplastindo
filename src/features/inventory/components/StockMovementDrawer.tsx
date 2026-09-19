import { useCallback, useState } from 'react'
import { Combobox, Field, InfoNote, Input, NumberInput } from '@/components/common'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import { useAsync } from '@/hooks/useAsync'
import { toAmount, today } from '@/lib'
import { ApiError } from '@/services/httpClient'
import { inventoryService } from '@/services/inventoryService'
import { masterDataService } from '@/services/masterDataService'
import type { StockMovementPayload } from '@/types'

type Props = { onClose: () => void; onSaved: () => void }

const typeOptions = [
  { value: 'consumption', label: 'Pemakaian bahan untuk produksi', description: 'Stok bahan berkurang; nilainya ke HPP pemakaian (jurnal otomatis)' },
  { value: 'production_in', label: 'Hasil produksi', description: 'Stok WIP / barang jadi bertambah (tanpa jurnal)' },
  { value: 'opening', label: 'Saldo awal stok', description: 'Kg dan harga per Kg awal; nilainya juga diisi di Saldo Awal neraca' },
  { value: 'adjustment', label: 'Penyesuaian', description: 'Koreksi stok masuk atau keluar' },
]

/** Input mutasi stok yang tidak lahir dari dokumen: pemakaian, produksi, saldo awal, penyesuaian. */
export function StockMovementDrawer({ onClose, onSaved }: Props) {
  const [date, setDate] = useState(today())
  const [productId, setProductId] = useState('')
  const [type, setType] = useState<StockMovementPayload['type']>('consumption')
  const [direction, setDirection] = useState<'in' | 'out'>('in')
  const [quantity, setQuantity] = useState('')
  const [unitCost, setUnitCost] = useState('')
  const [description, setDescription] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadProducts = useCallback(() => masterDataService.products(), [])
  const products = useAsync(loadProducts).data ?? []

  async function save() {
    setIsSaving(true)
    setError(null)
    try {
      await inventoryService.create({
        date, product_id: Number(productId), type,
        direction: type === 'adjustment' ? direction : undefined,
        quantity, unit_cost: unitCost || null, description: description || null,
      })
      onSaved()
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : 'Mutasi gagal disimpan.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Drawer size="md" eyebrow="Inventory" title="Input Mutasi Stok" onClose={onClose}>
      {error && <InfoNote tone="red">{error}</InfoNote>}
      <Field label="Jenis Mutasi" required>
        <Combobox clearable={false} options={typeOptions} value={type} onChange={v => setType(v as StockMovementPayload['type'])} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tanggal" required>
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </Field>
        <Field label="Produk" required>
          <Combobox placeholder="Pilih produk..." options={products.map(p => ({ value: String(p.id), label: p.name, description: `${p.code} · ${p.category_label}` }))} value={productId} onChange={setProductId} />
        </Field>
        {type === 'adjustment' && (
          <Field label="Arah" required>
            <Combobox clearable={false} options={[{ value: 'in', label: 'Masuk (+)' }, { value: 'out', label: 'Keluar (−)' }]} value={direction} onChange={v => setDirection(v as 'in' | 'out')} />
          </Field>
        )}
        <Field label="Kuantitas" required>
          <NumberInput decimals={3} suffix="Kg" value={quantity} onChange={setQuantity} />
        </Field>
        {(type === 'opening' || type === 'adjustment') && (
          <Field label="Harga per Kg">
            <NumberInput prefix="Rp" placeholder="0" value={unitCost} onChange={setUnitCost} />
          </Field>
        )}
      </div>
      <Field label="Keterangan">
        <Input value={description} onChange={e => setDescription(e.target.value)} />
      </Field>
      <div className="flex justify-end gap-2 border-t border-slate-200 pt-5">
        <Button variant="ghost" onClick={onClose} disabled={isSaving}>Batal</Button>
        <Button disabled={!productId || toAmount(quantity) <= 0 || isSaving} onClick={() => void save()}>
          {isSaving ? 'Menyimpan...' : 'Simpan Mutasi'}
        </Button>
      </div>
    </Drawer>
  )
}
