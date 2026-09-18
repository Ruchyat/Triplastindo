import type { ReactNode } from 'react'

type Props = {
  /** Jejak navigasi singkat, misalnya `Transaksi / Penjualan`. */
  eyebrow: string
  title: string
  /** Kosong selagi judulnya masih dimuat dari server. */
  description?: string
  actions?: ReactNode
}

/** Kop halaman: breadcrumb, judul, deskripsi, dan tombol aksi utama. */
export function PageHeader({ eyebrow, title, description, actions }: Props) {
  return (
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <p className="text-xs font-semibold text-blue-700">{eyebrow}</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 md:text-[28px]">
          {title}
        </h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}
