import { NavLink } from 'react-router-dom'
import { ChevronLeft, X } from 'lucide-react'
import { cn } from '@/lib'
import { navigationGroups, type NavItem } from './navigation'

type Props = {
  collapsed: boolean
  mobileOpen: boolean
  onCollapse: () => void
  onMobileClose: () => void
}

export function AppSidebar({ collapsed, mobileOpen, onCollapse, onMobileClose }: Props) {
  return (
    <>
      {mobileOpen && (
        <button
          aria-label="Tutup menu"
          onClick={onMobileClose}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[1px] lg:hidden"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-[#102a43] text-white transition-all duration-300',
          collapsed ? 'lg:w-[84px]' : 'lg:w-[264px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <SidebarBrand collapsed={collapsed} onMobileClose={onMobileClose} />

        <nav className="sidebar-scroll flex-1 overflow-y-auto px-3 py-4">
          {navigationGroups.map(group => (
            <div key={group.label} className="mb-5">
              {!collapsed && (
                <p className="mb-2 px-3 text-[10px] font-bold tracking-[.16em] text-slate-400">
                  {group.label}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map(item => (
                  <SidebarLink
                    key={item.path}
                    item={item}
                    collapsed={collapsed}
                    onNavigate={onMobileClose}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <button
          onClick={onCollapse}
          className={cn(
            'hidden h-12 items-center justify-center border-t border-white/10 lg:flex',
            'text-slate-400 hover:bg-white/5 hover:text-white',
          )}
        >
          <ChevronLeft size={18} className={cn('transition-transform', collapsed && 'rotate-180')} />
          {!collapsed && <span className="ml-2 text-xs font-semibold">Ciutkan sidebar</span>}
        </button>
      </aside>
    </>
  )
}

function SidebarBrand({ collapsed, onMobileClose }: { collapsed: boolean; onMobileClose: () => void }) {
  return (
    <div className="flex h-[72px] items-center gap-3 border-b border-white/10 px-5">
      <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-blue-500 font-black">T</div>
      {!collapsed && (
        <div className="min-w-0">
          <div className="text-sm font-bold tracking-[.14em]">TRIPLASTINDO</div>
          <div className="text-[10px] tracking-[.2em] text-blue-200">FINANCE</div>
        </div>
      )}
      <button aria-label="Tutup menu" onClick={onMobileClose} className="ml-auto text-slate-300 lg:hidden">
        <X size={20} />
      </button>
    </div>
  )
}

function SidebarLink({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem
  collapsed: boolean
  onNavigate: () => void
}) {
  return (
    <NavLink
      to={item.path}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          'flex h-10 items-center gap-3 rounded-lg px-3 text-[13px] font-medium transition',
          isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:bg-white/10 hover:text-white',
          collapsed && 'lg:justify-center lg:px-0',
        )
      }
    >
      <item.icon size={18} className="shrink-0" />
      {!collapsed && <span>{item.label}</span>}
    </NavLink>
  )
}
