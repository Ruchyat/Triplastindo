import { useCallback, useState } from 'react'
import { Plus } from 'lucide-react'
import { Card, CardHeader, Combobox, EmptyState, InfoNote, MiniStat, PageHeader, Status, TableWrap } from '@/components/common'
import { Button } from '@/components/ui/Button'
import { TabSwitch, type TabOption } from '@/components/ui/TabSwitch'
import { usePermissions } from '@/features/auth/usePermissions'
import { monthNames } from '@/features/reports/useReportPeriod'
import { useAsync } from '@/hooks/useAsync'
import { formatCurrency, formatDate, toAmount } from '@/lib'
import { payrollService } from '@/services/payrollService'
import { NewPayrollDrawer } from './components/NewPayrollDrawer'
import { PayrollRunView } from './components/PayrollRunView'
import { PayrollSummaryTab } from './components/PayrollSummaryTab'

type Tab = 'runs' | 'summary'

const tabs: TabOption<Tab>[] = [
  { value: 'runs', label: 'Payroll Bulanan' },
  { value: 'summary', label: 'Summary & Kasbon' },
]

const statusTone = { draft: 'slate', posted: 'green', cancelled: 'slate' } as const
const statusLabel = { draft: 'Draft', posted: 'Diposting', cancelled: 'Dibatalkan' } as const

/**
 * Gaji karyawan, mengikuti tab GAJI KARYAWAN.
 *
 * Satu payroll per bulan: draft diisi dari master karyawan, HR melengkapi
 * lembur, bonus, potongan, dan kasbon, lalu diposting menjadi jurnal.
 */
export function PayrollPage() {
  const permissions = usePermissions()
  const [tab, setTab] = useState<Tab>('runs')
  const [year, setYear] = useState(new Date().getFullYear())
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const load = useCallback(() => payrollService.list(year), [year])
  const { data: runs, error, isLoading, reload } = useAsync(load)
  const years = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - 3 + i))

  const posted = (runs ?? []).filter(r => r.status === 'posted')
  const sum = (pick: (r: (typeof posted)[number]) => string) => posted.reduce((t, r) => t + toAmount(pick(r)), 0)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Payroll / Gaji Karyawan"
        title="Gaji Karyawan"
        description="Payroll bulanan, jurnal gaji otomatis, dan monitoring kasbon"
        actions={
          <>
            <Combobox className="w-28" clearable={false} options={years.map(y => ({ value: y, label: y }))} value={String(year)} onChange={v => setYear(Number(v))} />
            {permissions.can('payroll.write') && (
              <Button onClick={() => setIsCreating(true)}>
                <Plus size={16} />
                Buat Payroll
              </Button>
            )}
          </>
        }
      />

      {error && <InfoNote tone="red">{error}</InfoNote>}

      <div className="grid gap-3 sm:grid-cols-3">
        <MiniStat label={`Gaji Kotor ${year}`} value={sum(r => r.total_gross)} />
        <MiniStat label="Gaji Bersih" value={sum(r => r.total_net)} tone="green" />
        <MiniStat label="Take Home Pay" value={sum(r => r.total_take_home)} hint={`${posted.length} payroll diposting`} />
      </div>

      <TabSwitch options={tabs} value={tab} onChange={setTab} />

      {tab === 'runs' && (
        <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
          <Card className="h-fit">
            <CardHeader title="Daftar Payroll" description="Klik untuk membuka rinciannya" />
            {(runs ?? []).length === 0 && !isLoading ? (
              <EmptyState title="Belum ada payroll" description="Buat payroll bulan ini lewat tombol di kanan atas." />
            ) : (
              <TableWrap>
                <thead>
                  <tr>
                    <th>Periode</th>
                    <th className="text-right">THP</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(runs ?? []).map(run => (
                    <tr key={run.id} className={`cursor-pointer ${run.id === selectedId ? 'bg-blue-50/60' : ''}`} onClick={() => setSelectedId(run.id)}>
                      <td>
                        <span className="block font-semibold text-blue-700">{monthNames[run.month - 1]} {run.year}</span>
                        <span className="text-[10px] text-slate-500">{run.number} · {formatDate(run.payment_date)} · {run.items_count} karyawan</span>
                      </td>
                      <td className="money">{formatCurrency(toAmount(run.total_take_home))}</td>
                      <td><Status tone={statusTone[run.status]}>{statusLabel[run.status]}</Status></td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            )}
          </Card>

          {selectedId ? (
            <PayrollRunView runId={selectedId} canWrite={permissions.can('payroll.write')} onChanged={reload} />
          ) : (
            <p className="text-xs text-slate-500">Pilih payroll di sebelah kiri.</p>
          )}
        </div>
      )}

      {tab === 'summary' && <PayrollSummaryTab year={year} />}

      {isCreating && (
        <NewPayrollDrawer
          onClose={() => setIsCreating(false)}
          onCreated={run => {
            setIsCreating(false)
            setYear(run.year)
            setSelectedId(run.id)
            reload()
          }}
        />
      )}
    </div>
  )
}
