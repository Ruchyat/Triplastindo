import { useMemo, useState } from 'react'
import { toAmount, today } from '@/lib'
import type { JournalEntryPayload } from '@/types'

/** Satu baris jurnal pada form, masih berupa teks apa adanya dari input. */
export type JournalLineDraft = {
  key: number
  accountCode: string
  description: string
  debit: string
  credit: string
}

const emptyLine = (key: number): JournalLineDraft => ({
  key,
  accountCode: '',
  description: '',
  debit: '',
  credit: '',
})


/**
 * State form jurnal manual, dipakai baik oleh jurnal sederhana maupun majemuk.
 *
 * Jurnal sederhana hanyalah jurnal majemuk dengan tepat dua baris; karena itu
 * keduanya berbagi state dan penyusunan payload yang sama, dan yang berbeda
 * cuma tampilannya.
 */
export function useManualJournalForm(initialLines = 2) {
  const [date, setDate] = useState(today)
  const [description, setDescription] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [lines, setLines] = useState<JournalLineDraft[]>(() =>
    Array.from({ length: initialLines }, (_, index) => emptyLine(index)),
  )

  const totals = useMemo(
    () =>
      lines.reduce(
        (sum, line) => ({
          debit: sum.debit + toAmount(line.debit),
          credit: sum.credit + toAmount(line.credit),
        }),
        { debit: 0, credit: 0 },
      ),
    [lines],
  )

  const difference = totals.debit - totals.credit

  function addLine() {
    setLines(current => [...current, emptyLine(Date.now())])
  }

  function removeLine(key: number) {
    setLines(current => (current.length <= 2 ? current : current.filter(line => line.key !== key)))
  }

  function updateLine(key: number, patch: Partial<JournalLineDraft>) {
    setLines(current => current.map(line => (line.key === key ? { ...line, ...patch } : line)))
  }

  /** Baris yang ikut dikirim: punya akun dan nominal di salah satu sisi. */
  const filledLines = lines.filter(
    line => line.accountCode && (toAmount(line.debit) > 0 || toAmount(line.credit) > 0),
  )

  /** Satu baris tidak boleh mengisi debit dan kredit sekaligus. */
  const hasTwoSidedLine = lines.some(line => toAmount(line.debit) > 0 && toAmount(line.credit) > 0)

  const isDirty =
    Boolean(description) || lines.some(line => line.accountCode || line.debit || line.credit)

  const isValid =
    Boolean(date) &&
    description.trim() !== '' &&
    filledLines.length >= 2 &&
    !hasTwoSidedLine &&
    difference === 0 &&
    totals.debit > 0

  function reset() {
    setDescription('')
    setPaymentMethod('')
    setLines(Array.from({ length: initialLines }, (_, index) => emptyLine(Date.now() + index)))
  }

  function toPayload(): JournalEntryPayload {
    return {
      date,
      description: description.trim(),
      payment_method: paymentMethod || null,
      lines: filledLines.map(line => ({
        account_code: line.accountCode,
        debit: toAmount(line.debit) > 0 ? line.debit : null,
        credit: toAmount(line.credit) > 0 ? line.credit : null,
        description: line.description || null,
      })),
    }
  }

  return {
    date, setDate,
    description, setDescription,
    paymentMethod, setPaymentMethod,
    lines, addLine, removeLine, updateLine,
    totals, difference, hasTwoSidedLine,
    isDirty, isValid,
    reset, toPayload,
  }
}

export type ManualJournalForm = ReturnType<typeof useManualJournalForm>
