import { Status } from '@/components/common'
import { formatCurrency } from '@/lib'

export type JournalPreviewLine = {
  side: 'D' | 'K'
  account: string
  /** Kosongkan bila nominal belum diketahui pada tahap preview. */
  amount?: number
}

/**
 * Preview jurnal double-entry yang akan dibentuk sistem dari sebuah dokumen.
 *
 * Preview ini bersifat informatif — pengguna operasional tidak mengetik
 * debit dan kredit, sistem yang menyusunnya saat dokumen diposting.
 */
export function JournalPreview({ lines }: { lines: JournalPreviewLine[] }) {
  const lastDebitIndex = lines.map(line => line.side).lastIndexOf('D')

  return (
    <div className="rounded-xl bg-blue-50 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-blue-900">Jurnal Otomatis</p>
        <Status tone="blue">Preview</Status>
      </div>
      <div className="mt-3 space-y-2 text-[11px] text-blue-800">
        {lines.map((line, index) => (
          <p
            key={`${line.side}-${line.account}-${index}`}
            className={index === lastDebitIndex + 1 ? 'border-t border-blue-200 pt-2' : undefined}
          >
            {line.side} · {line.account}
            {line.amount !== undefined && (
              <span className="float-right font-semibold">{formatCurrency(line.amount)}</span>
            )}
          </p>
        ))}
      </div>
    </div>
  )
}
