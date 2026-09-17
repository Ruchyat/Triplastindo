import type { ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'

/**
 * Tempat memasang provider global aplikasi.
 *
 * Saat backend Laravel tersedia, provider autentikasi, periode aktif, dan
 * query client dipasang di sini agar tidak menyebar ke setiap halaman.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return <BrowserRouter>{children}</BrowserRouter>
}
