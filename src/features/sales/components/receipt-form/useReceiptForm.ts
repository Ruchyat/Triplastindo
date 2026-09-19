import { useMemo, useState } from 'react'
import { toAmount, today } from '@/lib'
import type { ApiSalesInvoice, PaymentReceiptPayload } from '@/types'


/**
 * State form penerimaan pembayaran.
 *
 * Nilai buktinya tidak diketik pengguna melainkan dijumlahkan dari pelunasan
 * tiap invoice, sama seperti di backend — sehingga total yang terlihat di form
 * tidak mungkin berbeda dengan yang tersimpan.
 */
export function useReceiptForm(outstanding: ApiSalesInvoice[], preselectedId?: number) {
  const [date, setDate] = useState(today)
  const [cashAccountId, setCashAccountId] = useState('')
  const [reference, setReference] = useState('')
  const [note, setNote] = useState('')

  /** Nilai pelunasan per invoice, terindeks id invoice. Kosong berarti tidak ikut. */
  const [amounts, setAmounts] = useState<Record<number, string>>(() =>
    preselectedId ? { [preselectedId]: outstandingOf(outstanding, preselectedId) } : {},
  )

  const total = useMemo(
    () => Object.values(amounts).reduce((sum, value) => sum + toAmount(value), 0),
    [amounts],
  )

  const selectedCount = Object.values(amounts).filter(value => toAmount(value) > 0).length

  function setAmount(invoiceId: number, value: string) {
    setAmounts(current => ({ ...current, [invoiceId]: value }))
  }

  /** Mengisi penuh sisa piutang sebuah invoice, atau mengosongkannya. */
  function toggle(invoice: ApiSalesInvoice) {
    setAmounts(current => {
      const next = { ...current }
      if (toAmount(next[invoice.id]) > 0) delete next[invoice.id]
      else next[invoice.id] = invoice.outstanding_amount
      return next
    })
  }

  /** Nilai pelunasan melebihi sisa piutang invoicenya — backend akan menolak. */
  function isOver(invoice: ApiSalesInvoice): boolean {
    return toAmount(amounts[invoice.id]) > toAmount(invoice.outstanding_amount)
  }

  const hasOverpayment = outstanding.some(isOver)
  const isValid = Boolean(date) && Boolean(cashAccountId) && selectedCount > 0 && !hasOverpayment

  function toPayload(customerId: number): PaymentReceiptPayload {
    return {
      date,
      customer_id: customerId,
      cash_account_id: Number(cashAccountId),
      reference: reference || null,
      note: note || null,
      allocations: Object.entries(amounts)
        .filter(([, value]) => toAmount(value) > 0)
        .map(([invoiceId, value]) => ({ sales_invoice_id: Number(invoiceId), amount: value })),
    }
  }

  return {
    date, setDate,
    cashAccountId, setCashAccountId,
    reference, setReference,
    note, setNote,
    amounts, setAmount, toggle, isOver,
    total, selectedCount, isValid,
    toPayload,
  }
}

export type ReceiptForm = ReturnType<typeof useReceiptForm>

function outstandingOf(invoices: ApiSalesInvoice[], id: number): string {
  return invoices.find(invoice => invoice.id === id)?.outstanding_amount ?? ''
}
