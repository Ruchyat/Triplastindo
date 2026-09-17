import { Suspense, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { PageSkeleton } from '@/app/router/PageSkeleton'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { Topbar } from '@/components/layout/Topbar'
import { cn } from '@/lib'

/** Kerangka aplikasi: sidebar tetap di kiri, topbar, dan area konten halaman. */
export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50">
      <AppSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCollapse={() => setCollapsed(value => !value)}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div
        className={cn(
          'min-h-screen transition-[margin] duration-300',
          collapsed ? 'lg:ml-[84px]' : 'lg:ml-[264px]',
        )}
      >
        <Topbar onMenu={() => setMobileOpen(true)} />
        <main className="mx-auto max-w-[1600px] p-4 md:p-6 lg:p-8">
          {/* Sidebar dan topbar tetap terlihat selama bundel halaman dimuat. */}
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}
