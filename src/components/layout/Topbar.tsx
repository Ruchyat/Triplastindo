import { Bell, ChevronDown, Menu, Search } from 'lucide-react'
import { cn } from '@/lib'
import { activePeriod, currentUser } from '@/mocks/session'

export function Topbar({ onMenu }: { onMenu: () => void }) {
  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-[72px] items-center px-4 md:px-6',
        'border-b border-slate-200 bg-white/95 backdrop-blur',
      )}
    >
      <button
        aria-label="Buka menu"
        onClick={onMenu}
        className="mr-3 grid size-10 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
      >
        <Menu size={20} />
      </button>

      <div className="relative hidden max-w-sm flex-1 md:block">
        <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          aria-label="Cari"
          placeholder="Cari transaksi, akun, atau laporan..."
          className={cn(
            'h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none transition',
            'focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100',
          )}
        />
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-4">
        <div className="hidden border-r border-slate-200 pr-4 text-right sm:block">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Periode Aktif
          </p>
          <p className="text-xs font-semibold text-slate-700">{activePeriod.label}</p>
        </div>

        <button
          aria-label="Notifikasi"
          className="relative grid size-10 place-items-center rounded-lg text-slate-600 hover:bg-slate-100"
        >
          <Bell size={19} />
          <span className="absolute right-2 top-2 size-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>

        <button className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-100">
          <div className="grid size-8 place-items-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
            {currentUser.initials}
          </div>
          <div className="hidden text-left md:block">
            <p className="text-xs font-semibold text-slate-800">{currentUser.name}</p>
            <p className="text-[10px] text-slate-500">{currentUser.role}</p>
          </div>
          <ChevronDown size={14} className="hidden text-slate-400 md:block" />
        </button>
      </div>
    </header>
  )
}
