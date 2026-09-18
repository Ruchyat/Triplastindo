import type { ReactNode } from 'react'
import { cn } from '@/lib'

/** Wadah konten standar dengan border dan sudut membulat. */
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn('card', className)}>{children}</section>
}

type CardHeaderProps = {
  title: string
  description?: string
  action?: ReactNode
}

/** Kop kartu dengan judul, deskripsi opsional, dan area aksi. */
export function CardHeader({ title, description, action }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
      <div>
        <h2 className="text-sm font-bold text-slate-900">{title}</h2>
        {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  )
}

/** Judul bagian tanpa border, dipakai di dalam kartu yang sudah berpadding. */
export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  /** Tombol di sisi kanan judul, misalnya tambah data pendukung. */
  action?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-[15px] font-bold text-slate-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
