import type { ReactNode } from 'react'
import { EMPTY_VALUE } from '@/lib'

/** Pembungkus tabel dengan scroll horizontal pada layar sempit. */
export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="data-table">{children}</table>
    </div>
  )
}

type EmptyStateProps = {
  title?: string
  description?: string
}

/** Tampilan ketika tabel tidak memiliki data pada periode terpilih. */
export function EmptyState({
  title = 'Belum ada data',
  description = 'Data pada periode ini belum tersedia.',
}: EmptyStateProps) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center p-8 text-center">
      <div className="grid size-12 place-items-center rounded-full bg-slate-100 text-xl text-slate-400">
        {EMPTY_VALUE}
      </div>
      <h3 className="mt-3 text-sm font-bold text-slate-800">{title}</h3>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </div>
  )
}

/** Kaki tabel berisi info jumlah data dan keterangan tambahan. */
export function TableFooterNote({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 p-4 text-xs text-slate-500">
      {children}
    </div>
  )
}
