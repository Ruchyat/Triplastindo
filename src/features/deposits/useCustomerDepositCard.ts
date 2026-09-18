import { useCallback, useState } from 'react'
import { useAsync } from '@/hooks/useAsync'
import { toAmount } from '@/lib'
import { depositService } from '@/services/depositService'
import { ApiError } from '@/services/httpClient'
import type { ApiCustomerDeposit } from '@/types'

/** Satu mutasi beserta saldo deposit setelahnya. */
export type DepositCardRow = {
  movement: ApiCustomerDeposit
  /** Saldo setelah mutasi ini. Mutasi yang dibatalkan tidak mengubahnya. */
  balance: number
}

/**
 * Kartu deposit satu customer: seluruh mutasinya beserta saldo berjalan.
 *
 * Saldo berjalan dihitung dari yang terlama ke terbaru, lalu barisnya dibalik
 * agar yang terbaru tampil di atas — sama seperti membaca kartu buku besar.
 * Mutasi yang dibatalkan tetap ditampilkan tetapi tidak menggerakkan saldo.
 */
export function useCustomerDepositCard(customerId: number, onChanged: () => void) {
  const load = useCallback(
    () => depositService.list({ customerId, perPage: 100 }),
    [customerId],
  )
  const { data, isLoading, error, reload } = useAsync(load)

  const [isWorking, setIsWorking] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const rows = buildRows(data?.data ?? [])
  const balance = rows.find(row => row.movement.status !== 'cancelled')?.balance ?? 0

  async function cancel(id: number): Promise<boolean> {
    setIsWorking(true)
    setActionError(null)

    try {
      await depositService.cancel(id)
      onChanged()
      reload()
      return true
    } catch (failure) {
      setActionError(failure instanceof ApiError ? failure.message : 'Pembatalan gagal dijalankan.')
      return false
    } finally {
      setIsWorking(false)
    }
  }

  return { rows, balance, isLoading, error, isWorking, actionError, cancel }
}

/** @param movements urutan terbaru lebih dahulu, sebagaimana dikirim backend. */
function buildRows(movements: ApiCustomerDeposit[]): DepositCardRow[] {
  let running = 0

  const oldestFirst = [...movements].reverse().map(movement => {
    if (movement.status !== 'cancelled') {
      running += toAmount(movement.received) - toAmount(movement.applied_or_refunded)
    }

    return { movement, balance: running }
  })

  return oldestFirst.reverse()
}
