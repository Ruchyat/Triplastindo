import { useEffect, useRef } from 'react'
import { useBlocker } from 'react-router-dom'

/**
 * Menahan kepergian selama masih ada isian yang belum tersimpan.
 *
 * Dua jalan keluar dijaga sekaligus:
 *
 * - Berpindah halaman di dalam aplikasi — ditahan `useBlocker`, sehingga
 *   aplikasi dapat menampilkan dialog konfirmasinya sendiri.
 * - Menutup tab, menekan refresh, atau kembali keluar dari aplikasi — dijaga
 *   `beforeunload`, yang hanya dapat memunculkan dialog bawaan browser.
 *
 * Isian invoice bisa berisi belasan baris; kehilangannya karena satu klik yang
 * tidak disengaja adalah kerugian nyata, bukan sekadar gangguan.
 */
export function useUnsavedChanges(isDirty: boolean) {
  /*
   * Ditandai ketika isian berhasil disimpan.
   *
   * Sebuah ref, bukan state: menyimpan lalu berpindah halaman terjadi dalam
   * satu penanganan peristiwa, sedangkan perubahan state baru berlaku pada
   * render berikutnya. Dengan state, penjaga masih melihat isian sebagai belum
   * tersimpan dan menahan perpindahan — menanyakan "tinggalkan halaman ini?"
   * tepat setelah tombol Simpan ditekan.
   */
  const isReleased = useRef(false)

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !isReleased.current && isDirty && currentLocation.pathname !== nextLocation.pathname,
  )

  useEffect(() => {
    if (!isDirty || isReleased.current) return

    function warn(event: BeforeUnloadEvent) {
      event.preventDefault()
    }

    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [isDirty])

  return {
    /** Sedang menahan sebuah perpindahan, menunggu jawaban pengguna. */
    isBlocked: blocker.state === 'blocked',
    /** Melanjutkan perpindahan yang tertahan. */
    proceed: () => blocker.proceed?.(),
    /** Membatalkan perpindahan dan tetap di halaman ini. */
    stay: () => blocker.reset?.(),
    /**
     * Melepas penjagaan karena isiannya sudah tersimpan.
     *
     * Harus dipanggil tepat sebelum berpindah halaman setelah menyimpan.
     */
    release: () => {
      isReleased.current = true
    },
  }
}
