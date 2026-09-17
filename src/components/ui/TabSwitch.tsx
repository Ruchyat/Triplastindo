import { cn } from '@/lib'

export type TabOption<T extends string> = {
  value: T
  label: string
}

type Props<T extends string> = {
  options: readonly TabOption<T>[]
  value: T
  onChange: (value: T) => void
  /** `pill` untuk tab di dalam halaman, `solid` untuk pilihan mode form. */
  variant?: 'pill' | 'solid'
  className?: string
}

const containers = {
  pill: 'inline-flex flex-wrap rounded-lg bg-slate-200/60 p-1',
  solid: 'inline-flex flex-wrap rounded-xl border border-slate-200 bg-white p-1',
} as const

const actives = {
  pill: 'bg-white text-slate-900 shadow-sm',
  solid: 'bg-blue-700 text-white',
} as const

/** Kelompok tab untuk berpindah tampilan di dalam satu halaman. */
export function TabSwitch<T extends string>({
  options,
  value,
  onChange,
  variant = 'pill',
  className,
}: Props<T>) {
  return (
    <div className={cn(containers[variant], className)}>
      {options.map(option => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-md px-4 py-2 text-xs font-bold transition',
            variant === 'solid' && 'rounded-lg',
            value === option.value ? actives[variant] : 'text-slate-500 hover:text-slate-700',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
