import { useState } from 'react'
import { Card, CardHeader, EmptyState, InfoNote, Status, TableWrap } from '@/components/common'
import { JournalEntryCard } from '@/components/financial'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { usePermissions } from '@/features/auth/usePermissions'
import { monthNames } from '@/features/reports/useReportPeriod'
import { formatCurrency, formatDate, formatPercent, toAmount } from '@/lib'
import { ApiError } from '@/services/httpClient'
import { dividendService } from '@/services/dividendService'
import type { ApiDividendDecision } from '@/types'

type Props = { decisions: ApiDividendDecision[]; onChanged: () => void }

const statusTone = { draft: 'amber', approved: 'green', cancelled: 'slate' } as const
const statusLabel = { draft: 'Menunggu Direksi', approved: 'Disetujui', cancelled: 'Dibatalkan' } as const

/** Riwayat pengajuan dividen beserta alokasi per pemegang saham dan jurnalnya. */
export function DecisionsTab({ decisions, onChanged }: Props) {
  const permissions = usePermissions()
  const [confirm, setConfirm] = useState<{ decision: ApiDividendDecision; action: 'approve' | 'cancel' } | null>(null)
  const [isWorking, setIsWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function act() {
    if (!confirm) return
    setIsWorking(true)
    setError(null)
    try {
      if (confirm.action === 'approve') await dividendService.approve(confirm.decision.id)
      else await dividendService.cancel(confirm.decision.id)
      onChanged()
      setConfirm(null)
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : 'Gagal memproses.')
    } finally {
      setIsWorking(false)
    }
  }

  if (decisions.length === 0) {
    return <EmptyState title="Belum ada pengajuan dividen" description="Pengajuan dibuat dari tab Laba & Check Point." />
  }

  return (
    <div className="space-y-5">
      {decisions.map(d => (
        <Card key={d.id}>
          <CardHeader
            title={`${d.number} · Periode ${monthNames[d.month - 1]} ${d.year}`}
            description={`Diputuskan ${formatDate(d.decision_date)} · diajukan ${d.proposed_by?.name ?? '–'}${d.approved_by ? ` · disetujui ${d.approved_by.name}` : ''}`}
            action={
              <div className="flex items-center gap-2">
                <Status tone={statusTone[d.status]}>{statusLabel[d.status]}</Status>
                {d.status === 'draft' && permissions.can('dividends.approve') && (
                  <Button onClick={() => setConfirm({ decision: d, action: 'approve' })}>Setujui</Button>
                )}
                {d.status !== 'cancelled' && permissions.can('dividends.write') && (
                  <Button variant="outline" onClick={() => setConfirm({ decision: d, action: 'cancel' })}>Batalkan</Button>
                )}
              </div>
            }
          />
          <div className="grid gap-4 p-5 text-xs sm:grid-cols-4">
            <Fact label="Total Dividen" value={formatCurrency(toAmount(d.total_amount))} />
            <Fact label="Pajak Final" value={formatPercent(d.tax_rate)} />
            <Fact label="Saldo Kas saat Diajukan" value={`${formatCurrency(toAmount(d.cash_balance))} ${d.is_safe ? '✅' : '❌'}`} />
            <Fact label="Dibayar dari" value={d.cash_account?.name ?? '–'} />
          </div>
          <TableWrap>
            <thead>
              <tr>
                <th>Pemegang Saham</th>
                <th className="text-right">Saham</th>
                <th className="text-right">% Share</th>
                <th className="text-right">Dividen Bruto</th>
                <th className="text-right">Pajak</th>
                <th className="text-right">Dividen Net</th>
              </tr>
            </thead>
            <tbody>
              {(d.allocations ?? []).map(a => (
                <tr key={a.id}>
                  <td className="font-semibold">{a.shareholder}</td>
                  <td className="money">{a.shares.toLocaleString('id-ID')}</td>
                  <td className="money">{formatPercent(a.percentage)}</td>
                  <td className="money">{formatCurrency(toAmount(a.gross))}</td>
                  <td className="money !text-rose-700">{formatCurrency(toAmount(a.tax))}</td>
                  <td className="money !text-emerald-700">{formatCurrency(toAmount(a.net))}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
          {d.journal_entry && (
            <div className="p-5">
              <JournalEntryCard entry={d.journal_entry} />
            </div>
          )}
          {d.note && <p className="px-5 pb-4 text-xs text-slate-500">{d.note}</p>}
        </Card>
      ))}

      {error && !confirm && <InfoNote tone="red">{error}</InfoNote>}

      {confirm && (
        <ConfirmDialog
          title={confirm.action === 'approve' ? `Setujui dividen ${confirm.decision.number}?` : `Batalkan ${confirm.decision.number}?`}
          description={
            confirm.action === 'approve' ? (
              <>
                <p>
                  Jurnal terbentuk: D Dividen {formatCurrency(toAmount(confirm.decision.total_amount))} · K Hutang PPh Final · K{' '}
                  {confirm.decision.cash_account?.name}.
                </p>
                {!confirm.decision.is_safe && (
                  <p className="mt-2 font-semibold text-rose-700">Saldo kas saat diajukan di bawah minimum cash.</p>
                )}
              </>
            ) : (
              'Pengajuan ditandai batal; bila sudah disetujui, jurnalnya dibalik.'
            )
          }
          confirmLabel={confirm.action === 'approve' ? 'Setujui & Posting' : 'Batalkan'}
          tone={confirm.action === 'approve' ? 'default' : 'danger'}
          isWorking={isWorking}
          error={error}
          onCancel={() => setConfirm(null)}
          onConfirm={() => void act()}
        />
      )}
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-slate-400">{label}</p>
      <b className="text-slate-700">{value}</b>
    </div>
  )
}
