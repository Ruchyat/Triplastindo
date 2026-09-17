import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AlertCircle, Eye, EyeOff, Loader2, LockKeyhole } from 'lucide-react'
import { Field, Input } from '@/components/common'
import { Button } from '@/components/ui/Button'
import { routePaths } from '@/app/router/paths'
import { cn } from '@/lib'
import { ApiError } from '@/services/httpClient'
import { useAuth } from './useAuth'

/** Halaman masuk. Satu-satunya halaman yang dapat diakses tanpa sesi. */
export function LoginPage() {
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Halaman yang tadi hendak dibuka sebelum diarahkan ke login.
  const intended = (location.state as { from?: string } | null)?.from ?? routePaths.dashboard

  if (isAuthenticated) {
    return <Navigate to={intended} replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await login({ email, password })
      navigate(intended, { replace: true })
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught
          : new ApiError('Terjadi kesalahan tidak terduga.', 0),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // Galat kredensial dikirim Laravel pada field email.
  const message = error?.fieldError('email') ?? error?.message

  return (
    <div className="grid min-h-screen bg-slate-50 lg:grid-cols-[1.1fr_1fr]">
      <BrandPanel />

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <div className="grid size-11 place-items-center rounded-xl bg-[#102a43] text-lg font-black text-white">
              T
            </div>
          </div>

          <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-950">Masuk</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gunakan akun yang terdaftar untuk membuka aplikasi.
          </p>

          {message && (
            <div
              role="alert"
              className="mt-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs leading-5 text-rose-800"
            >
              <AlertCircle size={16} className="mt-px shrink-0" />
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
            <Field label="Email" required>
              <Input
                type="email"
                name="email"
                autoComplete="username"
                autoFocus
                placeholder="nama@triplastindo.com"
                value={email}
                onChange={event => setEmail(event.target.value)}
                aria-invalid={Boolean(error)}
              />
            </Field>

            <Field label="Kata Sandi" required>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="pr-11"
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  aria-invalid={Boolean(error)}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  onClick={() => setShowPassword(value => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            <Button
              type="submit"
              disabled={isSubmitting || !email || !password}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Memproses...
                </>
              ) : (
                'Masuk'
              )}
            </Button>
          </form>

          <p className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <LockKeyhole size={12} />
            Lupa kata sandi? Hubungi Super Admin.
          </p>
        </div>
      </div>
    </div>
  )
}

/** Panel identitas perusahaan di sisi kiri, disembunyikan pada layar sempit. */
function BrandPanel() {
  const points = [
    'Pencatatan transaksi bisnis dalam satu sistem',
    'Jurnal double-entry terbentuk otomatis',
    'Laporan keuangan yang dapat ditelusuri ke transaksi asal',
  ]

  return (
    <div className={cn('relative hidden flex-col justify-between bg-[#102a43] p-12 text-white lg:flex')}>
      <div className="flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-xl bg-blue-500 font-black">T</div>
        <div>
          <div className="text-sm font-bold tracking-[.14em]">TRIPLASTINDO</div>
          <div className="text-[10px] tracking-[.2em] text-blue-200">FINANCE</div>
        </div>
      </div>

      <div className="max-w-md">
        <h2 className="text-3xl font-bold leading-tight">
          Sistem informasi keuangan internal Triplastindo
        </h2>
        <ul className="mt-6 space-y-3">
          {points.map(point => (
            <li key={point} className="flex items-start gap-3 text-sm text-slate-300">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-blue-400" />
              {point}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-[11px] text-slate-400">
        Akses terbatas untuk karyawan Triplastindo yang berwenang.
      </p>
    </div>
  )
}
