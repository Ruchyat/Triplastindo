import { Paperclip } from 'lucide-react'
import type { JournalEntry } from '@/types'

/** Detail tambahan satu jurnal yang muncul saat barisnya dibuka. */
export function JournalDetailRow({ entry }: { entry: JournalEntry }) {
  const details = [
    { label: 'Dibuat oleh', value: entry.createdBy },
    { label: 'Jenis pembayaran', value: entry.paymentMethod },
    { label: 'Sumber', value: entry.source },
  ]

  return (
    <tr>
      <td colSpan={8} className="!bg-slate-50 !p-5">
        <div className="grid gap-4 text-xs sm:grid-cols-4">
          {details.map(detail => (
            <div key={detail.label}>
              <p className="text-slate-400">{detail.label}</p>
              <b className="text-slate-700">{detail.value}</b>
            </div>
          ))}
          <div>
            <p className="text-slate-400">Lampiran</p>
            <b className="inline-flex items-center gap-1 text-blue-700">
              <Paperclip size={12} />
              {entry.attachment}
            </b>
          </div>
        </div>
      </td>
    </tr>
  )
}
