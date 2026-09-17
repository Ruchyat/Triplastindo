import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib'

type Props = {
  icon: ReactNode
  title: string
  description: string
  onClick: () => void
  tone?: 'blue' | 'green' | 'amber'
}

const tones = {
  blue: 'bg-blue-50 text-blue-700',
  green: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
} as const

/** Pintasan untuk membuka form penerimaan, pembayaran, atau transfer. */
export function ActionCard({ icon, title, description, onClick, tone = 'blue' }: Props) {
  return (
    <button
      onClick={onClick}
      className="card flex items-center gap-4 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <span className={cn('grid size-11 shrink-0 place-items-center rounded-xl', tones[tone])}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <b className="block text-sm text-slate-900">{title}</b>
        <span className="mt-1 block text-[11px] leading-4 text-slate-500">{description}</span>
      </span>
      <ChevronRight size={17} className="text-slate-300" />
    </button>
  )
}
