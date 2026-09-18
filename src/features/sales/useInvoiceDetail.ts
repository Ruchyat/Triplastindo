import { useCallback, useState } from 'react'
import { useAsync } from '@/hooks/useAsync'
import { ApiError } from '@/services/httpClient'
import { salesService } from '@/services/salesService'

/**
 * Satu invoice beserta tindakan yang dapat dikenakan padanya.
 *
 * Tindakan yang tersedia ditentukan backend lewat status dokumennya, bukan
 * ditebak di sini: draft diposting atau dihapus, yang sudah diposting hanya
 * dapat dibatalkan. Bila aturannya dilanggar, backend menolak dengan pesan
 * yang langsung ditampilkan apa adanya.
 */
export function useInvoiceDetail(invoiceId: number, onChanged: () => void) {
  // Alamat yang tidak berupa angka tidak perlu ditanyakan ke server.
  const load = useCallback(
    () => (Number.isFinite(invoiceId) ? salesService.show(invoiceId) : Promise.reject(new ApiError('Alamat invoice tidak dikenali.', 404))),
    [invoiceId],
  )
  const { data: invoice, isLoading, error, reload } = useAsync(load)

  const [isWorking, setIsWorking] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  /**
   * Menjalankan satu tindakan dokumen.
   *
   * Setelah berhasil, daftar invoice ikut dimuat ulang karena nilai dan status
   * di tabel berubah — begitu juga ringkasan penjualan di atasnya.
   */
  async function run(action: () => Promise<unknown>, closeAfter = false) {
    setIsWorking(true)
    setActionError(null)

    try {
      await action()
      onChanged()
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
    invoice,
    isLoading,
    error,
    isWorking,
    actionError,
    post: () => run(() => salesService.post(invoiceId)),
    cancel: () => run(() => salesService.cancel(invoiceId)),
    remove: () => run(() => salesService.remove(invoiceId), true),
  }
}
