import type { ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/features/auth/AuthProvider'

/**
 * Provider global aplikasi.
 *
 * AuthProvider berada di dalam BrowserRouter karena halaman login perlu
 * melakukan navigasi setelah sesi terbentuk.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <BrowserRouter>
      <AuthProvider>{children}</AuthProvider>
    </BrowserRouter>
  )
}
