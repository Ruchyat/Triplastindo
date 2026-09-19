import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib'

/** Label field dengan penanda wajib isi. */
export function Field({
  label,
  children,
  required,
  className,
}: {
  label: string
  children: ReactNode
  required?: boolean
  className?: string
}) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 block text-xs font-semibold text-slate-700">
        {label}
        {required && <b className="ml-0.5 text-rose-500">*</b>}
      </span>
      {children}
    </label>
  )
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('field', className)} {...props} />
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn('field w-auto min-w-[130px]', className)} {...props}>
      {children}
    </select>
  )
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn('field min-h-24 py-2', className)} {...props} />
}

/** Pesan penolakan backend untuk satu field, ditampilkan tepat di bawah inputnya. */
export function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-[11px] text-rose-600">{message}</p>
}
