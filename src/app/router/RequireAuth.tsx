import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/useAuth'
import { routePaths } from './paths'

/**
 * Penjaga seluruh halaman aplikasi.
 *
 * Selama token yang tersimpan masih diverifikasi ke server, layar penantian
 * ditampilkan — tanpa ini, pengguna dengan sesi sah akan sempat terlempar ke
 * halaman login setiap kali aplikasi dimuat ulang.
 */
export function RequireAuth() {
  const { isAuthenticated, isBootstrapping } = useAuth()
  const location = useLocation()

  if (isBootstrapping) {
    return <SessionCheckScreen />
  }

  if (!isAuthenticated) {
    // Alamat yang dituju disimpan agar pengguna kembali ke sana setelah masuk.
    return <Navigate to={routePaths.login} state={{ from: location.pathname }} replace />
  }

  return <Outlet />
}

function SessionCheckScreen() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="grid size-11 animate-pulse place-items-center rounded-xl bg-[#102a43] text-lg font-black text-white">
          T
        </div>
        <p className="text-xs font-medium text-slate-500">Memeriksa sesi...</p>
      </div>
    </div>
  )
}
