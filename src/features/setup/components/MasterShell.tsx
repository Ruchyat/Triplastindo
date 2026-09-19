import type { ReactNode } from 'react'
import { Plus, Search } from 'lucide-react'
import { Card, CardHeader, EmptyState, InfoNote, TableWrap } from '@/components/common'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import type { ApiError } from '@/services/httpClient'

type PanelProps = {
  title: string
  description: string
  addLabel: string
  onAdd: () => void
  search: string
  onSearch: (value: string) => void
  searchPlaceholder: string
  error?: string | null
  isEmpty: boolean
  emptyText: string
  /** `<thead>` dan `<tbody>` tabelnya. */
  children: ReactNode
  /** Toggle atau kontrol tambahan di baris pencarian. */
  extra?: ReactNode
}

/** Kerangka panel master data: judul, tombol tambah, pencarian, dan tabel. */
export function MasterPanel({
  title,
  description,
  addLabel,
  onAdd,
  search,
  onSearch,
  searchPlaceholder,
  error,
  isEmpty,
  emptyText,
  children,
  extra,
}: PanelProps) {
  return (
    <Card>
      <CardHeader
        title={title}
        description={description}
        action={
          <Button onClick={onAdd}>
            <Plus size={15} />
            {addLabel}
          </Button>
        }
      />

      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1 lg:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            aria-label="Cari"
            placeholder={searchPlaceholder}
            className="field pl-9"
            value={search}
            onChange={event => onSearch(event.target.value)}
          />
        </div>
        {extra}
      </div>

      {error && (
        <div className="p-4">
          <InfoNote tone="red" variant="inset">{error}</InfoNote>
        </div>
      )}

      {isEmpty ? <EmptyState title="Tidak ada data" description={emptyText} /> : <TableWrap>{children}</TableWrap>}
    </Card>
  )
}

type DrawerProps = {
  title: string
  description?: string
  onClose: () => void
  onSave: () => void
  isSaving: boolean
  isValid: boolean
  error: ApiError | null
  children: ReactNode
}

/**
 * Panel form master data.
 *
 * Pesan penolakan umum tampil di atas; pesan per field ditampilkan oleh
 * masing-masing form di bawah inputnya lewat `FieldError`.
 */
export function MasterDrawer({ title, description, onClose, onSave, isSaving, isValid, error, children }: DrawerProps) {
  const hasFieldErrors = error !== null && Object.keys(error.errors).length > 0

  return (
    <Drawer size="md" eyebrow="Master Data" title={title} description={description} onClose={onClose}>
      {error && !hasFieldErrors && <InfoNote tone="red">{error.message}</InfoNote>}

      {children}

      <div className="flex justify-end gap-2 border-t border-slate-200 pt-5">
        <Button variant="ghost" onClick={onClose} disabled={isSaving}>
          Batal
        </Button>
        <Button disabled={!isValid || isSaving} onClick={onSave}>
          {isSaving ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </div>
    </Drawer>
  )
}

/** Saklar Aktif/Nonaktif yang dipakai semua form master data. */
export function ActiveToggle({ value, onChange }: { value: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700">
      <input
        type="checkbox"
        className="size-4 accent-blue-700"
        checked={value}
        onChange={event => onChange(event.target.checked)}
      />
      Aktif — muncul di dropdown form transaksi
    </label>
  )
}

/** Saklar untuk ikut menampilkan baris nonaktif. */
export function ShowInactive({ value, onChange }: { value: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
      <input
        type="checkbox"
        className="size-4 accent-blue-700"
        checked={value}
        onChange={event => onChange(event.target.checked)}
      />
      Tampilkan yang nonaktif
    </label>
  )
}
