import { use } from 'react'
import { AuthContext } from './AuthContext'

/** Membaca sesi pengguna yang sedang aktif. */
export function useAuth() {
  const context = use(AuthContext)

  if (!context) {
    throw new Error('useAuth harus dipakai di dalam <AuthProvider>.')
  }

  return context
}
