import { useCallback, useState } from 'react'
import { useAsync } from '@/hooks/useAsync'
import { ApiError } from '@/services/httpClient'
import { purchaseService } from '@/services/purchaseService'

/**
 * Satu tagihan pembelian beserta tindakan yang dapat dikenakan padanya.
 *
 * Cerminan useInvoiceDetail: draft diposting atau dihapus, yang sudah
 * diposting hanya dapat dibatalkan.
 */
export function usePurchaseBillDetail(billId: number) {
  const load = useCallback(
    () =>
      Number.isFinite(billId)
        ? purchaseService.show(billId)
        : Promise.reject(new ApiError('Alamat tagihan tidak dikenali.', 404)),
    [billId],
  )
  const { data: bill, isLoading, error, reload } = useAsync(load)

  const [isWorking, setIsWorking] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  async function run(action: () => Promise<unknown>, closeAfter = false) {
    setIsWorking(true)
    setActionError(null)

    try {
      await action()
      if (!closeAfter) reload()
      return true
    } catch (failure) {
      setActionError(failure instanceof ApiError ? failure.message : 'Tindakan gagal dijalankan.')
      return false
    } finally {
      setIsWorking(false)
    }
  }

  return {
    bill,
    isLoading,
    error,
    isWorking,
    actionError,
    post: () => run(() => purchaseService.post(billId)),
    cancel: () => run(() => purchaseService.cancel(billId)),
    remove: () => run(() => purchaseService.remove(billId), true),
  }
}
