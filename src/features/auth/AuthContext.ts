import { createContext } from 'react'
import type { AuthUser, LoginCredentials } from '@/types/auth'

export type AuthContextValue = {
  user: AuthUser | null
  /** True selama token tersimpan masih diperiksa ke server saat aplikasi dibuka. */
  isBootstrapping: boolean
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => Promise<void>
}

/**
 * Context terpisah dari komponen provider-nya agar berkas ini hanya
 * mengekspor nilai non-komponen — syarat react-refresh.
 */
export const AuthContext = createContext<AuthContextValue | null>(null)
