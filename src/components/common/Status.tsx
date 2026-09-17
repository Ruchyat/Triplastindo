import type { ReactNode } from 'react'
import { cn } from '@/lib'
import type { Tone } from '@/types'

const tones: Record<Tone, string> = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/10',
  red: 'bg-rose-50 text-rose-700 ring-rose-600/10',
  blue: 'bg-blue-50 text-blue-700 ring-blue-600/10',
  slate: 'bg-slate-100 text-slate-600 ring-slate-500/10',
}

/** Badge status untuk kolom tabel dan penanda kondisi dokumen. */
export function Status({ children, tone = 'slate' }: { children: ReactNode; tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset',
        tones[tone],
      )}
    >
      {children}
    </span>
  )
}
