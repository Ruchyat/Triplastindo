import { useState } from 'react'
import type { DocumentType, SettlementMethod } from '@/types'
import { sampleCustomerDeposit, sampleInvoiceTotal } from './config'

/**
 * State dan perhitungan form dokumen transaksi.
 *
 * Aturan yang diterapkan di sini:
 * - Penjualan hanya boleh diselesaikan dengan Cash, Bank, atau Piutang;
 *   pembelian dengan Cash, Bank, atau Utang.
 * - Termin dan jatuh tempo hanya relevan bila metodenya Piutang / Utang.
 * - Saldo deposit customer dipotong lebih dulu, sisanya baru menjadi piutang.
 */
export function useDocumentForm(type: DocumentType) {
  const isSale = type === 'sale'
  const isPurchase = type === 'purchase'

  const [settlement, setSettlement] = useState<SettlementMethod>(
    isSale ? 'Piutang' : isPurchase ? 'Utang' : 'Bank',
  )
  const [downPayment, setDownPayment] = useState(0)
  const [downPaymentChannel, setDownPaymentChannel] = useState<'Bank' | 'Cash'>('Bank')

  /** Saldo deposit customer terpilih; nol untuk dokumen selain penjualan. */
  const availableDeposit = isSale ? sampleCustomerDeposit : 0

  /** Dokumen kredit — memunculkan blok termin, DP, dan potongan deposit. */
  const isDeferred =
    (isSale && settlement === 'Piutang') || (isPurchase && settlement === 'Utang')

  const total = sampleInvoiceTotal
  const appliedDeposit = isDeferred ? availableDeposit : 0
  const remainingReceivable = Math.max(total - downPayment - appliedDeposit, 0)

  /** Akun lawan pada sisi kredit penjualan atau sisi kredit pembelian. */
  const settlementAccount =
    settlement === 'Cash'
      ? 'Kas'
      : settlement === 'Bank'
        ? 'Bank'
        : isSale
          ? 'Piutang Usaha'
          : 'Utang Usaha'

  return {
    settlement,
    setSettlement,
    downPayment,
    setDownPayment,
    downPaymentChannel,
    setDownPaymentChannel,
    isDeferred,
    total,
    appliedDeposit,
    remainingReceivable,
    settlementAccount,
  }
}

export type DocumentFormState = ReturnType<typeof useDocumentForm>
