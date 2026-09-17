import { Card } from '@/components/common'
import { cn } from '@/lib'
import { setupTabs, type SetupTabId } from '../tabs'

type Props = {
  active: SetupTabId
  onChange: (tab: SetupTabId) => void
}

/** Navigasi tab master data di sisi kiri halaman Setup. */
export function SetupNav({ active, onChange }: Props) {
  return (
    <Card className="h-fit p-2">
      <nav>
        {setupTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-xs font-semibold transition',
              active === tab.id ? 'bg-blue-700 text-white' : 'text-slate-600 hover:bg-slate-50',
            )}
          >
            <tab.icon size={17} />
            {tab.label}
          </button>
        ))}
      </nav>
    </Card>
  )
}
