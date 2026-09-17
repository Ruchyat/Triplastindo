import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authService } from '@/services/authService'
import { setUnauthenticatedHandler } from '@/services/httpClient'
import { tokenStorage } from '@/services/tokenStorage'
import type { AuthUser, LoginCredentials } from '@/types/auth'
import { AuthContext, type AuthContextValue } from './AuthContext'

/**
 * Menyimpan sesi pengguna untuk seluruh aplikasi.
 *
 * Saat aplikasi dibuka, token yang tersimpan diverifikasi ke `/api/me`.
 * Token yang sudah dicabut di server otomatis dibersihkan, sehingga pengguna
 * tidak pernah melihat antarmuka dengan sesi yang sebenarnya sudah mati.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)

  // Tanpa token tersimpan tidak ada yang perlu diverifikasi, sehingga aplikasi
  // langsung siap menampilkan halaman login.
  const [isBootstrapping, setIsBootstrapping] = useState(() => tokenStorage.get() !== null)

  /** Membersihkan sesi lokal tanpa memanggil server. */
  const clearSession = useCallback(() => {
    tokenStorage.clear()
    setUser(null)
  }, [])

  // Token yang ditolak server di tengah pemakaian langsung mengakhiri sesi.
  useEffect(() => {
    setUnauthenticatedHandler(clearSession)
    return () => setUnauthenticatedHandler(null)
  }, [clearSession])

  useEffect(() => {
    if (!tokenStorage.get()) return

    let active = true

    authService
      .me()
      .then(currentUser => {
        if (active) setUser(currentUser)
      })
      .catch(() => {
        // Token tidak berlaku lagi; pengguna diarahkan untuk masuk kembali.
        if (active) clearSession()
      })
      .finally(() => {
        if (active) setIsBootstrapping(false)
      })

    return () => {
      active = false
    }
  }, [clearSession])

  const login = useCallback(async (credentials: LoginCredentials) => {
    const { token, user: loggedIn } = await authService.login(credentials)
    tokenStorage.set(token)
    setUser(loggedIn)
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } catch {
      // Server mungkin tidak terjangkau, tetapi sesi lokal tetap harus berakhir.
    } finally {
      clearSession()
    }
  }, [clearSession])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isBootstrapping,
      isAuthenticated: user !== null,
      login,
      logout,
    }),
    [user, isBootstrapping, login, logout],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
