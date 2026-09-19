import { useCallback, useState } from 'react'
import { Card, CardHeader, Combobox, InfoNote, Status, TableWrap } from '@/components/common'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { monthNames } from '@/features/reports/useReportPeriod'
import { useAsync } from '@/hooks/useAsync'
import { formatCurrency, formatCurrencyOrDash, toAmount } from '@/lib'
import { ApiError } from '@/services/httpClient'
import { assetService } from '@/services/assetService'

type Props = { canWrite: boolean; onChanged: () => void }

const short = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

/**
 * Rekap penyusutan per jenis per bulan, dan tombol menjalankan penyusutan
 * bulanan — satu jurnal per jenis aset.
 */
export function DepreciationTab({ canWrite, onChanged }: Props) {
  const [year, setYear] = useState(new Date().getFullYear())
  const load = useCallback(() => assetService.schedule(year), [year])
  const { data, error, reload } = useAsync(load)
  const [confirm, setConfirm] = useState<{ month: number; action: 'run' | 'undo' } | null>(null)
  const [isWorking, setIsWorking] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  async function execute() {
    if (!confirm) return
    setIsWorking(true)
    setActionError(null)
    try {
      if (confirm.action === 'run') await assetService.runDepreciation(year, confirm.month)
      else await assetService.undoDepreciation(year, confirm.month)
      reload()
      onChanged()
      setConfirm(null)
    } catch (failure) {
      setActionError(failure instanceof ApiError ? failure.message : 'Gagal memproses penyusutan.')
    } finally {
      setIsWorking(false)
    }
  }

  const years = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - 3 + i))
  const lastPosted = data ? Math.max(0, ...data.months.filter(m => m.posted).map(m => m.month)) : 0

  return (
    <div className="space-y-5">
      {error && <InfoNote tone="red">{error}</InfoNote>}

      <Card>
        <CardHeader
          title={`Penyusutan Bulanan ${year}`}
          description="Jalankan berurutan tiap akhir bulan; jurnalnya D beban penyusutan · K akumulasi per jenis"
          action={
            <Combobox className="w-28" clearable={false} options={years.map(y => ({ value: y, label: y }))} value={String(year)} onChange={v => setYear(Number(v))} />
          }
        />
        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
          {(data?.months ?? []).map(m => (
            <div key={m.month} className="rounded-xl border border-slate-200 p-4">
              <div className="flex justify-between">
                <p className="text-xs font-bold">{monthNames[m.month - 1]}</p>
                <Status tone={m.posted ? 'green' : 'slate'}>{m.posted ? 'Diposting' : 'Belum'}</Status>
              </div>
              <p className="mt-2 text-sm font-bold tabular-nums text-slate-900">{formatCurrencyOrDash(toAmount(m.total))}</p>
              <p className="text-[10px] text-slate-500">{m.posted ? `${m.assets} aset` : ' '}</p>
              {canWrite && (
                <div className="mt-2">
                  {m.posted
                    ? m.month === lastPosted && (
                        <button type="button" className="text-xs font-semibold text-rose-600" onClick={() => setConfirm({ month: m.month, action: 'undo' })}>
                          Batalkan
                        </button>
                      )
                    : m.month === lastPosted + 1 && (
                        <Button variant="outline" className="h-8 px-3 text-xs" onClick={() => setConfirm({ month: m.month, action: 'run' })}>
                          Jalankan
                        </Button>
                      )}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Depresiasi per Jenis Aset" description="Nominal yang sudah diposting tiap bulan, beserta perkiraan per bulan dan per tahun" />
        <TableWrap>
          <thead>
            <tr>
              <th>Jenis Aset</th>
              <th className="text-right">Per Bulan</th>
              <th className="text-right">Per Tahun</th>
              {short.map(s => <th key={s} className="text-right">{s}</th>)}
            </tr>
          </thead>
          <tbody>
            {(data?.by_type ?? []).map(row => (
              <tr key={row.type}>
                <td className="font-semibold">{row.type}</td>
                <td className="money">{formatCurrencyOrDash(toAmount(row.monthly_expected))}</td>
                <td className="money">{formatCurrencyOrDash(toAmount(row.yearly_expected))}</td>
                {row.months.map((m, i) => (
                  <td key={i} className="money">{formatCurrencyOrDash(toAmount(m))}</td>
                ))}
              </tr>
            ))}
            {data && (
              <tr className="bg-slate-50 font-bold">
                <td>Grand Total</td>
                <td className="money">{formatCurrency(data.by_type.reduce((s, r) => s + toAmount(r.monthly_expected), 0))}</td>
                <td className="money">{formatCurrency(data.by_type.reduce((s, r) => s + toAmount(r.yearly_expected), 0))}</td>
                {short.map((_, i) => (
                  <td key={i} className="money">{formatCurrencyOrDash(data.by_type.reduce((s, r) => s + toAmount(r.months[i]), 0))}</td>
                ))}
              </tr>
            )}
          </tbody>
        </TableWrap>
      </Card>

      {confirm && (
        <ConfirmDialog
          title={`${confirm.action === 'run' ? 'Jalankan' : 'Batalkan'} penyusutan ${monthNames[confirm.month - 1]} ${year}?`}
          description={
            confirm.action === 'run'
              ? 'Satu jurnal per jenis aset akan diposting per akhir bulan: D beban penyusutan · K akumulasi penyusutan.'
              : 'Baris penyusutan bulan ini dihapus dan jurnalnya dibalik.'
          }
          confirmLabel={confirm.action === 'run' ? 'Jalankan' : 'Batalkan Penyusutan'}
          tone={confirm.action === 'run' ? 'default' : 'danger'}
          isWorking={isWorking}
          error={actionError}
          onCancel={() => setConfirm(null)}
          onConfirm={() => void execute()}
        />
      )}
    </div>
  )
}
