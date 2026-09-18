import type { ReactNode } from 'react'
import { AuthProvider } from '@/features/auth/AuthProvider'

/**
 * Provider global aplikasi.
 *
 * Berada di luar router: AuthProvider sendiri tidak memerlukan konteks router,
 * sedangkan router kini dibangun lewat `createBrowserRouter` yang merender
 * dirinya sendiri. Halaman login tetap dapat bernavigasi karena ia berada di
 * dalam router.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}
