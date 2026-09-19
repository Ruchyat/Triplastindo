import { useState } from 'react'
import { Combobox, Field, FieldError, InfoNote, Input } from '@/components/common'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import { ApiError } from '@/services/httpClient'
import { masterDataService } from '@/services/masterDataService'
import type { ApiProduct, ApiProductCategory } from '@/types'

type Props = {
  categories: ApiProductCategory[]
  /** Kategori pembelian yang sedang dipilih, untuk menebak kategori produknya. */
  purchaseCategory: string
  onClose: () => void
  onCreated: (product: ApiProduct) => void
}

/**
 * Kategori produk yang paling mungkin untuk sebuah kategori pembelian.
 *
 * Hanya tebakan awal supaya pencatat tinggal mengetik nama; tetap dapat
 * diganti bila barangnya ternyata lain.
 */
const productCategoryFor: Record<string, string> = {
  bahan_baku_polos: 'bahan_baku',
  bahan_baku_kw: 'bahan_baku',
  bahan_pendukung: 'bahan_pendukung',
  sparepart: 'sparepart',
}

/**
 * Form produk baru yang dibuka dari dalam tagihan pembelian.
 *
 * Barang yang dibeli sering belum ada di master — supplier baru, bahan baru.
 * Menyuruh pencatat ke halaman Setup lalu kembali berarti isian tagihannya
 * hilang, jadi produknya dibuat di sini dan langsung masuk ke baris item.
 */
export function QuickProductDrawer({ categories, purchaseCategory, onClose, onCreated }: Props) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState(productCategoryFor[purchaseCategory] ?? 'lainnya')
  const [unit, setUnit] = useState('Kg')
  const [code, setCode] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  const isValid = name.trim() !== '' && category !== '' && unit.trim() !== ''

  async function save() {
    setIsSaving(true)
    setError(null)

    try {
      onCreated(
        await masterDataService.createProduct({
          name: name.trim(),
          category,
          unit: unit.trim(),
          code: code.trim() || null,
        }),
      )
    } catch (failure) {
      setError(
        failure instanceof ApiError
          ? failure
          : new ApiError('Produk gagal disimpan. Coba lagi.', 0),
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Drawer
      size="md"
      eyebrow="Master Data"
      title="Produk Baru"
      description="Produk langsung masuk ke baris item setelah tersimpan."
      onClose={onClose}
    >
      {error && !Object.keys(error.errors).length && <InfoNote tone="red">{error.message}</InfoNote>}

      <Field label="Nama Produk" required>
        <Input
          autoFocus
          placeholder="Misalnya Bahan Baku Warna"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && isValid && !isSaving) void save()
          }}
        />
        <FieldError message={error?.fieldError('name')} />
      </Field>

      <Field label="Kategori Produk" required>
        <Combobox clearable={false} options={categories} value={category} onChange={setCategory} />
        <FieldError message={error?.fieldError('category')} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Satuan" required>
          <Input placeholder="Kg" value={unit} onChange={e => setUnit(e.target.value)} />
          <FieldError message={error?.fieldError('unit')} />
        </Field>
        <Field label="Kode">
          <Input
            placeholder="Dibuat otomatis"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
          />
          <FieldError message={error?.fieldError('code')} />
        </Field>
      </div>

      <div className="flex justify-end gap-2 border-t border-slate-200 pt-5">
        <Button variant="ghost" onClick={onClose} disabled={isSaving}>
          Batal
        </Button>
        <Button disabled={!isValid || isSaving} onClick={() => void save()}>
          {isSaving ? 'Menyimpan...' : 'Simpan Produk'}
        </Button>
      </div>
    </Drawer>
  )
}
