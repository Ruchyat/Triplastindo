import type { ReactNode } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/Button'

type Props = {
  children?: ReactNode
  /** Sembunyikan kotak pencarian bila tabel sudah punya filter sendiri. */
  search?: boolean
}

/** Baris filter di atas tabel: pencarian, dropdown periode, dan tombol filter lanjutan. */
export function FilterBar({ children, search = true }: Props) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center">
      {search && (
        <div className="relative min-w-0 flex-1 lg:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input aria-label="Cari data" placeholder="Cari data..." className="field pl-9" />
        </div>
      )}
      <div className="flex flex-1 flex-wrap gap-2">{children}</div>
      <Button variant="outline">
        <SlidersHorizontal size={15} />
        Filter
      </Button>
    </div>
  )
}
