import type { ReactNode } from 'react'
import { cn } from '@/lib'

type Props = {
  children: ReactNode
  tone?: 'blue' | 'amber'
  /** `block` berdiri sendiri di halaman, `inset` menempel di dalam kartu. */
  variant?: 'block' | 'inset'
}

const tones = {
  blue: 'border-blue-200 bg-blue-50 text-blue-800',
  amber: 'border-amber-200 bg-amber-50 text-amber-800',
} as const

/** Catatan penjelas aturan bisnis, misalnya cara kerja deposit atau piutang. */
export function InfoNote({ children, tone = 'blue', variant = 'block' }: Props) {
  return (
    <div
      className={cn(
        'text-xs leading-5',
        tones[tone],
        variant === 'block' ? 'rounded-xl border px-4 py-3' : 'border-b p-4',
      )}
    >
      {children}
    </div>
  )
}
