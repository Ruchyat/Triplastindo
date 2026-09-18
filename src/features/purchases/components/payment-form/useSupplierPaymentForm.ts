import { useMemo, useState } from 'react'
import { toAmount } from '@/lib'
import type { ApiPurchaseBill, SupplierPaymentPayload } from '@/types'

const today = () => new Date().toISOString().slice(0, 10)

/**
 * State form pembayaran supplier.
 *
 * Nilai buktinya dijumlahkan dari pembayaran tiap tagihan, sama seperti di
 * backend — sehingga total yang terlihat di form tidak mungkin berbeda dengan
 * yang tersimpan.
 */
export function useSupplierPaymentForm(outstanding: ApiPurchaseBill[], preselectedId?: number) {
  const [date, setDate] = useState(today)
  const [cashAccountId, setCashAccountId] = useState('')
  const [reference, setReference] = useState('')
  const [note, setNote] = useState('')

  /** Nilai pembayaran per tagihan, terindeks id tagihan. Kosong berarti tidak ikut. */
  const [amounts, setAmounts] = useState<Record<number, string>>(() =>
    preselectedId ? { [preselectedId]: outstandingOf(outstanding, preselectedId) } : {},
  )

  const total = useMemo(
    () => Object.values(amounts).reduce((sum, value) => sum + toAmount(value), 0),
    [amounts],
  )

  const selectedCount = Object.values(amounts).filter(value => toAmount(value) > 0).length

  function setAmount(billId: number, value: string) {
    setAmounts(current => ({ ...current, [billId]: value }))
  }

  /** Mengisi penuh sisa utang sebuah tagihan, atau mengosongkannya. */
  function toggle(bill: ApiPurchaseBill) {
    setAmounts(current => {
      const next = { ...current }
      if (toAmount(next[bill.id]) > 0) delete next[bill.id]
      else next[bill.id] = bill.outstanding_amount
      return next
    })
  }

  /** Nilai pembayaran melebihi sisa utang tagihannya — backend akan menolak. */
  function isOver(bill: ApiPurchaseBill): boolean {
    return toAmount(amounts[bill.id]) > toAmount(bill.outstanding_amount)
  }

  const hasOverpayment = outstanding.some(isOver)
  const isValid = Boolean(date) && Boolean(cashAccountId) && selectedCount > 0 && !hasOverpayment

  function toPayload(supplierId: number): SupplierPaymentPayload {
    return {
      date,
      supplier_id: supplierId,
      cash_account_id: Number(cashAccountId),
      reference: reference || null,
      note: note || null,
      allocations: Object.entries(amounts)
        .filter(([, value]) => toAmount(value) > 0)
        .map(([billId, value]) => ({ purchase_bill_id: Number(billId), amount: value })),
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

export type SupplierPaymentForm = ReturnType<typeof useSupplierPaymentForm>

function outstandingOf(bills: ApiPurchaseBill[], id: number): string {
  return bills.find(bill => bill.id === id)?.outstanding_amount ?? ''
}
