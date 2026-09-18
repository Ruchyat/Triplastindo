import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { Status } from '@/components/common'
import { toPath } from '@/app/router'
import { cn, formatCurrency, formatDate, toAmount } from '@/lib'
import type { ApiJournalEntry, ApiJournalLine } from '@/types'

/** Jumlah kolom tabel, dipakai baris accordion yang membentang penuh. */
export const JOURNAL_COLUMNS = 8

type Props = {
  entry: ApiJournalEntry
  isOpen: boolean
  onToggle: () => void
}

/**
 * Baris-baris jurnal satu transaksi.
 *
 * Tabelnya rata: satu baris tabel adalah satu sisi debit atau kredit, tanpa
 * baris kepala — bentuk yang sama dengan tab JURNAL UMUM di Google Sheet.
 * Nomor bukti dan tanggal berlaku untuk seluruh transaksi, jadi ditulis sekali
 * di baris pertama dan dikosongkan di bawahnya; garis tebal menandai
 * pergantian transaksi.
 *
 * Nomor dokumen asal ikut ditampilkan di sel nomor bukti karena itu yang
 * paling sering dicocokkan saat pemeriksaan, sehingga tidak perlu diklik.
 * Sisanya — sumber, metode pembayaran, pembuat, total — muncul di accordion.
 */
export function JournalEntryGroup({ entry, isOpen, onToggle }: Props) {
  const lines = entry.lines ?? []

  return (
    <Fragment>
      {lines.map((line, index) => (
        <tr
          key={line.id}
          onClick={onToggle}
          className={cn('cursor-pointer', isOpen && 'bg-blue-50/60')}
        >
          <td className={cn('align-top', index === 0 && 'border-t-2 border-t-slate-200')}>
            {index === 0 && <EntryNumber entry={entry} />}
          </td>
          <td className={cn('align-top', index === 0 && 'border-t-2 border-t-slate-200')}>
            {index === 0 && formatDate(entry.date)}
          </td>
          <LineCells line={line} isFirst={index === 0} />
        </tr>
      ))}

      {isOpen && <DetailRow entry={entry} />}
    </Fragment>
  )
}

/** Nomor jurnal, dengan nomor dokumen asalnya di bawahnya. */
function EntryNumber({ entry }: { entry: ApiJournalEntry }) {
  return (
    <>
      <span className="block font-bold text-blue-700">{entry.number}</span>
      {entry.source_number && documentPath(entry) && (
        <Link
          to={documentPath(entry)!}
          // Klik pada tautan tidak ikut membuka accordion.
          onClick={event => event.stopPropagation()}
          className="mt-0.5 block text-[11px] text-slate-500 underline decoration-slate-300 underline-offset-2 hover:text-blue-700"
        >
          {entry.source_number}
        </Link>
      )}
    </>
  )
}

function LineCells({ line, isFirst }: { line: ApiJournalLine; isFirst: boolean }) {
  const isDebit = toAmount(line.debit) > 0
  const border = isFirst ? 'border-t-2 border-t-slate-200' : undefined

  return (
    <>
      <td className={cn('font-semibold text-slate-700', border)}>{line.account?.code}</td>
      <td className={cn('font-medium text-slate-800', border)}>{line.account?.name}</td>
      <td className={cn('text-slate-500', border)}>{line.account?.category?.name}</td>
      <td className={cn('text-slate-500', border)}>{line.description ?? '–'}</td>
      <td className={cn('money', border)}>
        {isDebit ? formatCurrency(toAmount(line.debit)) : '–'}
      </td>
      <td className={cn('money', border)}>
        {isDebit ? '–' : formatCurrency(toAmount(line.credit))}
      </td>
    </>
  )
}

/**
 * Keterangan transaksi yang muncul saat salah satu barisnya diklik.
 *
 * Sengaja satu baris yang membungkus, bukan grid: ia hanya pelengkap saat
 * diminta, dan tidak boleh berubah menjadi baris kepala permanen yang memecah
 * tabel menjadi dua jenis baris.
 */
function DetailRow({ entry }: { entry: ApiJournalEntry }) {
  const facts = [
    { label: 'Keterangan', value: entry.description },
    { label: 'Sumber', value: entry.source_label },
    { label: 'Metode', value: entry.payment_method ?? '–' },
    { label: 'Dibuat oleh', value: entry.created_by?.name ?? '–' },
    { label: 'Total', value: formatCurrency(toAmount(entry.total_debit)) },
  ]

  return (
    <tr className="bg-blue-50/60">
      <td colSpan={JOURNAL_COLUMNS} className="whitespace-normal py-3">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11px]">
          {facts.map(fact => (
            <span key={fact.label}>
              <span className="text-slate-400">{fact.label}: </span>
              <b className="text-slate-700">{fact.value}</b>
            </span>
          ))}
          <Status tone={entry.tagging === 'kas_bank' ? 'blue' : 'slate'}>
            {entry.tagging_label}
          </Status>
        </div>
      </td>
    </tr>
  )
}

/**
 * Alamat halaman dokumen asal sebuah jurnal.
 *
 * Memakai `source_id`, bukan nomornya: dokumennya punya halaman sendiri,
 * sehingga tidak perlu lagi menyaring daftar untuk menemukannya. Jenis dokumen
 * yang halamannya belum ada dikembalikan sebagai `null`, dan nomornya
 * ditampilkan tanpa tautan.
 */
function documentPath(entry: ApiJournalEntry): string | null {
  if (!entry.source_id) return null

  switch (entry.source) {
    case 'sale':
      return toPath.salesInvoice(entry.source_id)
    case 'purchase':
      return toPath.purchaseBill(entry.source_id)
    case 'cash_receipt':
      return toPath.receipt(entry.source_id)
    default:
      return null
  }
}
