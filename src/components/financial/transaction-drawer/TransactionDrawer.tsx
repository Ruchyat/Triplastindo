import { Field, Input, Select, Textarea } from '@/components/common'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import type { DocumentType, SettlementMethod } from '@/types'
import { JournalPreview } from '../JournalPreview'
import { buildJournalPreview } from './buildJournalPreview'
import { documentTitles } from './config'
import { DeferredPaymentFields } from './DeferredPaymentFields'
import { LineItemsTable } from './LineItemsTable'
import {
  DepositPartyFields,
  ExpenseFields,
  SettlementDocumentField,
  TradePartyField,
  TransferFields,
} from './PartyFields'
import { useDocumentForm } from './useDocumentForm'

type Props = {
  type: DocumentType
  onClose: () => void
}

/**
 * Form pembuatan dokumen transaksi bisnis.
 *
 * Pengguna mencatat kejadian bisnis satu kali — penjualan, pembelian,
 * pengeluaran, pembayaran, atau deposit — lalu sistem membentuk jurnal
 * double-entry secara otomatis. Preview jurnal ditampilkan agar Finance
 * tetap dapat memeriksa hasilnya sebelum dokumen diposting.
 */
export function TransactionDrawer({ type, onClose }: Props) {
  const form = useDocumentForm(type)

  const isSale = type === 'sale'
  const isPurchase = type === 'purchase'
  const isTrade = isSale || isPurchase
  const isTransfer = type === 'transfer'
  const isSettlement = type === 'receipt' || type === 'payment'
  const isDepositFlow = type === 'deposit' || type === 'refund'

  return (
    <Drawer
      eyebrow="Transaksi Baru"
      title={documentTitles[type]}
      description="Jurnal akan dibuat otomatis setelah dokumen diposting."
      onClose={onClose}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nomor Dokumen">
          <Input placeholder="Dibuat otomatis" readOnly />
        </Field>
        <Field label="Tanggal" required>
          <Input type="date" />
        </Field>
      </div>

      {isTrade && <TradePartyField type={isSale ? 'sale' : 'purchase'} />}
      {isDepositFlow && <DepositPartyFields isRefund={type === 'refund'} />}
      {type === 'expense' && <ExpenseFields />}
      {isTransfer && <TransferFields />}
      {isSettlement && <SettlementDocumentField type={type} />}
      {isTrade && <LineItemsTable type={isSale ? 'sale' : 'purchase'} />}

      <div className="grid gap-4 sm:grid-cols-2">
        {!isTransfer && (
          <Field label="Nominal" required>
            <Input placeholder="Rp 0" />
          </Field>
        )}
        <Field label="Metode Pembayaran" required>
          {isTrade ? (
            <Select
              className="w-full"
              value={form.settlement}
              onChange={event => form.setSettlement(event.target.value as SettlementMethod)}
            >
              <option>Cash</option>
              <option>Bank</option>
              <option>{isSale ? 'Piutang' : 'Utang'}</option>
            </Select>
          ) : (
            <Select className="w-full">
              <option>Bank</option>
              <option>Cash</option>
            </Select>
          )}
        </Field>
      </div>

      {form.isDeferred && <DeferredPaymentFields isSale={isSale} form={form} />}

      <Field label="Keterangan">
        <Textarea className="min-h-20" placeholder="Keterangan transaksi" />
      </Field>

      <JournalPreview lines={buildJournalPreview(type, form)} />

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1">
          Simpan Draft
        </Button>
        <Button className="flex-1">Simpan & Posting</Button>
      </div>
    </Drawer>
  )
}
