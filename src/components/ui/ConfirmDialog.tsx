import { useEffect, useRef, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from './Button'
import { cn } from '@/lib'

type Props = {
  title: string
  /** Akibat yang akan terjadi — bukan sekadar "Anda yakin?". */
  description: ReactNode
  confirmLabel: string
  cancelLabel?: string
  /** `danger` untuk tindakan yang tidak dapat diurungkan. */
  tone?: 'danger' | 'default'
  isWorking?: boolean
  /**
   * Pesan penolakan dari backend.
   *
   * Ditampilkan di dalam dialog, bukan di panel di belakangnya — dialognya
   * menutupi panel itu, sehingga pesan di sana tidak akan terbaca.
   */
  error?: string | null
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Konfirmasi sebelum tindakan yang tidak dapat diurungkan.
 *
 * Isinya menyebutkan akibatnya secara spesifik — jurnal mana yang dibalik,
 * piutang siapa yang kembali — bukan pertanyaan "Anda yakin?" yang lama-lama
 * hanya ditekan tanpa dibaca.
 *
 * Fokus awal jatuh pada tombol batal, dan Escape menutup dialog: tekanan tidak
 * sengaja pada spasi atau enter tidak boleh berakibat apa pun.
 */
export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  cancelLabel = 'Batal',
  tone = 'danger',
  isWorking = false,
  error = null,
  onConfirm,
  onCancel,
}: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    cancelRef.current?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCancel()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onCancel])

  return (
    <>
      {/* Di atas Drawer, yang memakai z-40 dan z-50. */}
      <div className="fixed inset-0 z-[60] bg-slate-950/45" />

      <div className="fixed inset-0 z-[70] grid place-items-center p-4">
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
        >
          <div className="flex gap-3">
            <div
              className={cn(
                'grid size-10 shrink-0 place-items-center rounded-full',
                tone === 'danger' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600',
              )}
            >
              <AlertTriangle size={20} />
            </div>
            <div className="min-w-0">
              <h2 id="confirm-title" className="text-sm font-bold text-slate-900">
                {title}
              </h2>
              <div className="mt-1.5 text-xs leading-5 text-slate-600">{description}</div>
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-800">
              {error}
            </p>
          )}

          <div className="mt-5 flex gap-2">
            <Button ref={cancelRef} variant="outline" className="flex-1" onClick={onCancel}>
              {cancelLabel}
            </Button>
            <Button
              className={cn('flex-1', tone === 'danger' && 'bg-rose-600 hover:bg-rose-700')}
              disabled={isWorking}
              onClick={onConfirm}
            >
              {isWorking ? 'Memproses...' : confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
