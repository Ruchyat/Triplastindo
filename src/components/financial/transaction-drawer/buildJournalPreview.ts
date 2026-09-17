import type { DocumentType } from '@/types'
import type { JournalPreviewLine } from '../JournalPreview'
import type { DocumentFormState } from './useDocumentForm'

/**
 * Menyusun baris jurnal yang akan dibentuk sistem dari sebuah dokumen.
 *
 * Fungsi ini memisahkan aturan akuntansi dari tampilan form, sehingga saat
 * backend Laravel tersedia, logikanya tinggal diganti oleh respons API tanpa
 * mengubah komponen.
 */
export function buildJournalPreview(
  type: DocumentType,
  form: DocumentFormState,
): JournalPreviewLine[] {
  const { settlement, downPayment, downPaymentChannel, appliedDeposit, remainingReceivable, total, settlementAccount } = form

  switch (type) {
    case 'sale': {
      if (settlement !== 'Piutang') {
        return [
          { side: 'D', account: settlement === 'Cash' ? 'Kas' : 'Bank', amount: total },
          { side: 'K', account: 'Penjualan', amount: total },
        ]
      }
      // Penjualan kredit: DP dan saldo deposit mengurangi piutang yang terbentuk.
      const lines: JournalPreviewLine[] = []
      if (downPayment > 0) lines.push({ side: 'D', account: downPaymentChannel, amount: downPayment })
      if (appliedDeposit > 0) lines.push({ side: 'D', account: 'Deposit Pelanggan', amount: appliedDeposit })
      if (remainingReceivable > 0) lines.push({ side: 'D', account: 'Piutang Usaha', amount: remainingReceivable })
      lines.push({ side: 'K', account: 'Penjualan', amount: total })
      return lines
    }

    case 'purchase':
      return [
        { side: 'D', account: 'Persediaan / Beban / Aset' },
        { side: 'K', account: settlementAccount },
      ]

    case 'expense':
      return [
        { side: 'D', account: 'Beban Operasional' },
        { side: 'K', account: 'Kas / Bank' },
      ]

    case 'transfer':
      return [
        { side: 'D', account: 'Akun Tujuan' },
        { side: 'K', account: 'Akun Asal' },
      ]

    case 'deposit':
      // Deposit diterima sebelum ada invoice, jadi dicatat sebagai kewajiban.
      return [
        { side: 'D', account: 'Bank' },
        { side: 'K', account: 'Deposit Pelanggan' },
      ]

    case 'refund':
      return [
        { side: 'D', account: 'Deposit Pelanggan' },
        { side: 'K', account: 'Bank' },
      ]

    case 'receipt':
      return [
        { side: 'D', account: 'Kas / Bank' },
        { side: 'K', account: 'Piutang Usaha' },
      ]

    case 'payment':
      return [
        { side: 'D', account: 'Utang Usaha' },
        { side: 'K', account: 'Kas / Bank' },
      ]
  }
}
