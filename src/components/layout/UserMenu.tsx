import { useEffect, useRef, useState } from 'react'
import { ChevronDown, LogOut, UserRound } from 'lucide-react'
import { useAuth } from '@/features/auth/useAuth'
import { cn } from '@/lib'

/** Inisial dari nama, misalnya `Super Admin` menjadi `SA`. */
function initialsOf(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('')
}

/** Identitas pengguna di topbar beserta tombol keluar. */
export function UserMenu() {
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Menu tertutup saat pengguna mengklik di luar area menu.
  useEffect(() => {
    if (!isOpen) return

    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  if (!user) return null

  async function handleLogout() {
    setIsLoggingOut(true)
    await logout()
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(value => !value)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-100"
      >
        <div className="grid size-8 place-items-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
          {initialsOf(user.name)}
        </div>
        <div className="hidden text-left md:block">
          <p className="text-xs font-semibold text-slate-800">{user.name}</p>
          <p className="text-[10px] text-slate-500">{user.role_label}</p>
        </div>
        <ChevronDown
          size={14}
          className={cn('hidden text-slate-400 transition md:block', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
        >
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
            <p className="mt-0.5 truncate text-xs text-slate-500">{user.email}</p>
            <span className="mt-2 inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
              {user.role_label}
            </span>
          </div>

          <button
            role="menuitem"
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            <UserRound size={15} />
            Profil saya
          </button>

          <button
            role="menuitem"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex w-full items-center gap-2.5 border-t border-slate-100 px-4 py-2.5 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60"
          >
            <LogOut size={15} />
            {isLoggingOut ? 'Keluar...' : 'Keluar'}
          </button>
        </div>
      )}
    </div>
  )
}
