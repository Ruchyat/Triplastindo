import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react'
import { cn } from '@/lib'

type ButtonVariant = 'primary' | 'outline' | 'ghost'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: ButtonVariant
  /** Dipakai dialog konfirmasi untuk menaruh fokus awal pada tombol batal. */
  ref?: Ref<HTMLButtonElement>
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-blue-700 text-white hover:bg-blue-800',
  outline: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
  ghost: 'text-slate-600 hover:bg-slate-100',
}

export function Button({ children, variant = 'primary', className, ref, ...props }: Props) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex h-10 items-center justify-center gap-2 rounded-lg px-3.5 text-sm font-semibold transition',
        'focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
