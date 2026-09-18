import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/services/httpClient'

type State<T> = {
  data: T | null
  error: string | null
}

/**
 * Menjalankan sebuah permintaan API dan menyimpan hasilnya.
 *
 * `run` harus stabil — bungkus dengan `useCallback` di pemanggil, dan
 * cantumkan filter yang memengaruhinya sebagai dependensi. Perubahan
 * identitas `run` itulah yang memicu pemuatan ulang.
 *
 * Data lama dibiarkan tampil selama pemuatan berikutnya berlangsung, supaya
 * tabel tidak berkedip kosong setiap kali filter berubah. Jawaban yang keburu
 * usang — karena filternya berubah lagi atau komponennya ditutup — diabaikan.
 */
export function useAsync<T>(run: () => Promise<T>) {
  const [state, setState] = useState<State<T>>({ data: null, error: null })
  const [version, setVersion] = useState(0)

  /** Memuat ulang dengan filter yang sama, misalnya setelah menyimpan data. */
  const reload = useCallback(() => setVersion(current => current + 1), [])

  useEffect(() => {
    let cancelled = false

    run().then(
      data => {
        if (!cancelled) setState({ data, error: null })
      },
      failure => {
        if (cancelled) return
        setState({
          data: null,
          error: failure instanceof ApiError ? failure.message : 'Terjadi kesalahan tak terduga.',
        })
      },
    )

    return () => {
      cancelled = true
    }
  }, [run, version])

  return {
    ...state,
    /** Belum ada apa pun untuk ditampilkan: belum ada data dan belum ada galat. */
    isLoading: state.data === null && state.error === null,
    reload,
  }
}
