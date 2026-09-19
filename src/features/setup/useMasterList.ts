import { useCallback, useState } from 'react'
import { useAsync } from '@/hooks/useAsync'
import { ApiError } from '@/services/httpClient'

/**
 * Daftar master data beserta state form tambah/sunting-nya.
 *
 * Pola yang sama untuk COA, customer, supplier, dan produk: memuat daftar,
 * membuka panel untuk satu baris (atau baris baru), menyimpan, lalu memuat
 * ulang daftarnya.
 */
export function useMasterList<T extends { id: number }>(load: () => Promise<T[]>) {
  const list = useAsync(load)
  const [search, setSearch] = useState('')
  /** `null` tertutup, `'new'` baris baru, selain itu baris yang disunting. */
  const [editing, setEditing] = useState<T | 'new' | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  const close = useCallback(() => {
    setEditing(null)
    setError(null)
  }, [])

  async function save(action: () => Promise<unknown>) {
    setIsSaving(true)
    setError(null)
    try {
      await action()
      list.reload()
      close()
    } catch (failure) {
      setError(failure instanceof ApiError ? failure : new ApiError('Gagal menyimpan. Coba lagi.', 0))
    } finally {
      setIsSaving(false)
    }
  }

  return {
    items: list.data ?? [],
    isLoading: list.isLoading,
    loadError: list.error,
    search, setSearch,
    editing, setEditing, close,
    isSaving, error, save,
  }
}
