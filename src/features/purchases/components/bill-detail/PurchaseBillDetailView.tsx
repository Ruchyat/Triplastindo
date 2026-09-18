import { useState } from 'react'
import { InfoNote, SectionHeader, Status } from '@/components/common'
import { JournalEntryCard } from '@/components/financial'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { formatCurrency, formatDate, formatNumber, toAmount } from '@/lib'
import { documentStatusTone, type ApiPurchaseBill } from '@/types'
import type { usePurchaseBillDetail } from '../../usePurchaseBillDetail'

type Props = {
  detail: ReturnType<typeof usePurchaseBillDetail>
  onDeleted: () => void
  /** Membuka form pembayaran dengan tagihan ini sudah tercentang. */
  onPay: () => void
}

/** Detail satu tagihan pembelian beserta tindakannya. */
export function PurchaseBillDetailView({ detail, onDeleted, onPay }: Props) {
  const bill = detail.bill

  return (
    <div className="space-y-5">
      {detail.error && <InfoNote tone="red">{detail.error}</InfoNote>}
      {detail.isLoading && !bill && <p className="text-xs text-slate-500">Memuat tagihan...</p>}

      {bill && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Status tone={documentStatusTone[bill.display_status]}>
              {bill.display_status_label}
            </Status>
            <Status tone="blue">{bill.category_label}</Status>
            {bill.note && <span className="text-xs text-slate-500">{bill.note}</span>}
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <Fact label="No. Nota Supplier" value={bill.supplier_invoice_number ?? '–'} />
            <Fact label="Metode Pembayaran" value={bill.settlement_method_label} />
            <Fact label="Akun Kas/Bank" value={bill.cash_account?.label ?? '–'} />
            <Fact label="Termin" value={bill.term_days ? `${bill.term_days} hari` : '–'} />
            <Fact label="Jatuh Tempo" value={bill.due_date ? formatDate(bill.due_date) : '–'} />
            <Fact label="Didebit ke Akun" value={bill.debit_account_code ?? '–'} />
          </div>

          <SectionHeader title="Item" />
          <ItemList bill={bill} />

          <SectionHeader title="Nilai" />
          <ValueSummary bill={bill} />

          <SectionHeader title="Jurnal" />
          <JournalPanel bill={bill} />

          <p className="text-[11px] text-slate-400">
            Dibuat oleh {bill.created_by?.name ?? '–'}
            {bill.created_at && ` · ${formatDate(bill.created_at)}`}
          </p>

          <BillActions bill={bill} detail={detail} onDeleted={onDeleted} onPay={onPay} />
        </>
      )}
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-slate-400">{label}</p>
      <b className="text-slate-700">{value}</b>
    </div>
  )
}

function ItemList({ bill }: { bill: ApiPurchaseBill }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
            <th className="px-3 py-2 text-left">{bill.is_stock_category ? 'Produk' : 'Keterangan'}</th>
            <th className="px-3 py-2 text-right">Qty</th>
            <th className="px-3 py-2 text-right">Harga</th>
            <th className="px-3 py-2 text-right">Jumlah</th>
          </tr>
        </thead>
        <tbody>
          {(bill.items ?? []).map(item => (
            <tr key={item.id} className="border-t border-slate-100">
              <td className="px-3 py-2 font-medium text-slate-800">{item.label}</td>
              <td className="px-3 py-2 text-right tabular-nums">
                {formatNumber(toAmount(item.quantity))} {item.unit}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {formatCurrency(toAmount(item.unit_price))}
              </td>
              <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-900">
                {formatCurrency(toAmount(item.amount))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ValueSummary({ bill }: { bill: ApiPurchaseBill }) {
  const rows = [
    { label: 'Subtotal', value: bill.subtotal },
    ...(toAmount(bill.tax_amount) > 0 ? [{ label: 'PPN Masukan', value: bill.tax_amount }] : []),
    { label: 'Total Tagihan', value: bill.total, strong: true },
    { label: 'Sudah Dibayar', value: bill.paid_amount },
    { label: 'Sisa Utang', value: bill.outstanding_amount, strong: true },
  ]

  return (
    <div className="rounded-xl border border-slate-200">
      {rows.map(row => (
        <div
          key={row.label}
          className="flex justify-between border-b border-slate-100 px-4 py-2.5 text-xs last:border-b-0"
        >
          <span className={row.strong ? 'font-semibold text-slate-700' : 'text-slate-500'}>
            {row.label}
          </span>
          <span
            className={
              row.strong ? 'font-bold tabular-nums text-slate-900' : 'tabular-nums text-slate-700'
            }
          >
            {formatCurrency(toAmount(row.value))}
          </span>
        </div>
      ))}
    </div>
  )
}

function JournalPanel({ bill }: { bill: ApiPurchaseBill }) {
  const entry = bill.journal_entry

  if (!entry) {
    return (
      <InfoNote tone="amber">
        Tagihan ini masih draft, jadi belum menghasilkan jurnal. Nilainya belum masuk laporan mana
        pun sampai diposting.
      </InfoNote>
    )
  }

  return <JournalEntryCard entry={entry} />
}

type ActionProps = {
  bill: ApiPurchaseBill
  detail: ReturnType<typeof usePurchaseBillDetail>
  onDeleted: () => void
  onPay: () => void
}

/** Tindakan yang tersedia, mengikuti status dokumen. */
function BillActions({ bill, detail, onDeleted, onPay }: ActionProps) {
  const [confirming, setConfirming] = useState<'cancel' | 'delete' | null>(null)
  const isOutstanding = bill.status === 'unpaid' || bill.status === 'partial'

  if (bill.status === 'cancelled') {
    return (
      <InfoNote tone="amber">
        Tagihan ini sudah dibatalkan. Jurnalnya tidak dihapus, melainkan dibalik oleh jurnal
        tersendiri agar jejaknya tetap dapat ditelusuri.
      </InfoNote>
    )
  }

  return (
    <>
      <div className="flex gap-2 border-t border-slate-200 pt-4">
        {bill.status === 'draft' ? (
          <>
            <Button
              variant="outline"
              className="flex-1"
              disabled={detail.isWorking}
              onClick={() => setConfirming('delete')}
            >
              Hapus Draft
            </Button>
            <Button className="flex-1" disabled={detail.isWorking} onClick={() => void detail.post()}>
              {detail.isWorking ? 'Memproses...' : 'Posting Tagihan'}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              className="flex-1"
              disabled={detail.isWorking}
              onClick={() => setConfirming('cancel')}
            >
              Batalkan Tagihan
            </Button>
            {isOutstanding && (
              <Button className="flex-1" onClick={onPay}>
                Bayar Tagihan
              </Button>
            )}
          </>
        )}
      </div>

      {confirming === 'delete' && (
        <ConfirmDialog
          title={`Hapus draft ${bill.number}?`}
          description="Draft ini belum menghasilkan jurnal, jadi tidak ada angka laporan yang berubah. Dokumennya sendiri tidak dapat dikembalikan."
          confirmLabel="Hapus Draft"
          isWorking={detail.isWorking}
          error={detail.actionError}
          onCancel={() => setConfirming(null)}
          onConfirm={async () => {
            if (await detail.remove()) onDeleted()
          }}
        />
      )}

      {confirming === 'cancel' && (
        <ConfirmDialog
          title={`Batalkan tagihan ${bill.number}?`}
          description={
            <>
              <p>
                Jurnal {bill.journal_entry?.number} akan dibalik oleh jurnal pembalik — bukan
                dihapus, sehingga jejaknya tetap dapat ditelusuri.
              </p>
              <ul className="mt-2 list-inside list-disc space-y-0.5">
                <li>
                  Utang kepada {bill.supplier?.name} berkurang{' '}
                  <b>{formatCurrency(toAmount(bill.outstanding_amount))}</b>
                </li>
                <li>
                  Nilai pada {bill.debit_account_code} berkurang{' '}
                  <b>{formatCurrency(toAmount(bill.subtotal))}</b>
                </li>
              </ul>
              <p className="mt-2">Pembatalan tidak dapat diurungkan.</p>
            </>
          }
          confirmLabel="Batalkan Tagihan"
          cancelLabel="Jangan Batalkan"
          isWorking={detail.isWorking}
          error={detail.actionError}
          onCancel={() => setConfirming(null)}
          onConfirm={async () => {
            if (await detail.cancel()) setConfirming(null)
          }}
        />
      )}
    </>
  )
}
