import { useState, type ReactNode } from 'react'
import { InfoNote, SectionHeader, Status } from '@/components/common'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { formatCurrency } from '@/lib'
import type { ApiJournalEntry, ApiReceiptStatus } from '@/types'
import { JournalEntryCard } from './JournalEntryCard'

type Props = {
  number: string
  status: ApiReceiptStatus
  statusLabel: string
  amount: number
  /** Pasangan label–nilai yang ditampilkan dalam kisi dua kolom. */
  facts: { label: string; value: ReactNode }[]
  journalEntry?: ApiJournalEntry
  /** Isi di antara fakta dan jurnal, misalnya rincian alokasi. */
  children?: ReactNode
  /** Kata benda dokumennya untuk tombol dan dialog: "pengeluaran", "transfer". */
  noun: string
  /** Akibat pembatalan yang perlu diketahui pengguna sebelum mengonfirmasi. */
  cancelConsequence: ReactNode
  cancelledNote: ReactNode
  isWorking: boolean
  actionError: string | null
  onCancel: () => Promise<void>
}

/**
 * Detail bukti kas sederhana — pengeluaran, transfer — beserta pembatalannya.
 *
 * Bentuknya sama untuk semua bukti: status dan nilai, fakta-fakta, jurnal, dan
 * satu tombol batal yang dialognya menyebut akibatnya secara spesifik.
 */
export function VoucherDetail({
  number,
  status,
  statusLabel,
  amount,
  facts,
  journalEntry,
  children,
  noun,
  cancelConsequence,
  cancelledNote,
  isWorking,
  actionError,
  onCancel,
}: Props) {
  const [isConfirming, setIsConfirming] = useState(false)
  const title = noun.charAt(0).toUpperCase() + noun.slice(1)

  return (
    <div className="space-y-5">
      {actionError && !isConfirming && <InfoNote tone="red">{actionError}</InfoNote>}

      <div className="flex items-center gap-2">
        <Status tone={status === 'posted' ? 'green' : 'slate'}>{statusLabel}</Status>
        <span className="text-sm font-bold text-slate-900">{formatCurrency(amount)}</span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-xs">
        {facts.map(fact => (
          <div key={fact.label}>
            <p className="text-slate-400">{fact.label}</p>
            <b className="text-slate-700">{fact.value ?? '–'}</b>
          </div>
        ))}
      </div>

      {children}

      <SectionHeader title="Jurnal" />
      {journalEntry && <JournalEntryCard entry={journalEntry} />}

      {status === 'cancelled' ? (
        <InfoNote tone="amber">{cancelledNote}</InfoNote>
      ) : (
        <div className="border-t border-slate-200 pt-4">
          <Button
            variant="outline"
            className="w-full"
            disabled={isWorking}
            onClick={() => setIsConfirming(true)}
          >
            Batalkan {title}
          </Button>
        </div>
      )}

      {isConfirming && (
        <ConfirmDialog
          title={`Batalkan ${noun} ${number}?`}
          description={
            <>
              {cancelConsequence}
              <p className="mt-2">Pembatalan tidak dapat diurungkan.</p>
            </>
          }
          confirmLabel={`Batalkan ${title}`}
          cancelLabel="Jangan Batalkan"
          isWorking={isWorking}
          error={actionError}
          onCancel={() => setIsConfirming(false)}
          onConfirm={() =>
            // Bila gagal, dialog tetap terbuka dan menampilkan pesan penolakannya.
            void onCancel().then(
              () => setIsConfirming(false),
              () => undefined,
            )
          }
        />
      )}
    </div>
  )
}
