import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib'

type Props = {
  eyebrow?: string
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
  /** Lebar maksimal panel. Form dokumen memakai `xl`, form ringkas memakai `md`. */
  size?: 'md' | 'xl'
}

const sizes = { md: 'max-w-md', xl: 'max-w-xl' } as const

/** Panel geser dari kanan untuk form pembuatan dokumen dan detail data. */
export function Drawer({ eyebrow, title, description, onClose, children, size = 'xl' }: Props) {
  return (
    <>
      <button
        aria-label="Tutup panel"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[1px]"
      />
      <aside
        className={cn(
          'fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white shadow-2xl',
          sizes[size],
        )}
      >
        <div className="sticky top-0 flex items-start justify-between border-b border-slate-200 bg-white px-6 py-5">
          <div>
            {eyebrow && (
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">{eyebrow}</p>
            )}
            <h2 className="mt-1 text-lg font-bold text-slate-900">{title}</h2>
            {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
          </div>
          <button
            aria-label="Tutup"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <X size={19} />
          </button>
        </div>
        <div className="space-y-5 p-6">{children}</div>
      </aside>
    </>
  )
}
