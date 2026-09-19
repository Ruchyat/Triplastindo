import { useCallback, useState } from 'react'
import { Card, CardHeader, InfoNote, MiniStat, Status, TableWrap } from '@/components/common'
import { Button } from '@/components/ui/Button'
import { usePermissions } from '@/features/auth/usePermissions'
import { monthNames } from '@/features/reports/useReportPeriod'
import { useAsync } from '@/hooks/useAsync'
import { formatAccountingCurrency, formatCurrency, formatCurrencyOrDash, formatDate, formatPercent, toAmount } from '@/lib'
import { dividendService } from '@/services/dividendService'
import type { ApiDividendCheckpoint } from '@/types'
import { ProposalDrawer } from './ProposalDrawer'

type Props = { year: number; onProposed: () => void }

const decisionLabel = { draft: 'Diajukan', approved: 'Dibagikan', cancelled: 'Batal' } as const

/**
 * Tabel laba rugi bersih per bulan dan check point kas — ✅ Aman bila saldo
 * kas akhir ≥ minimum cash — beserta status pembagiannya.
 */
export function CheckpointTab({ year, onProposed }: Props) {
  const permissions = usePermissions()
  const load = useCallback(() => dividendService.checkpoints(year), [year])
  const { data, error, reload } = useAsync(load)
  const [proposing, setProposing] = useState<ApiDividendCheckpoint | null>(null)

  const months = data ?? []
  const ytdProfit = months.length ? toAmount(months[months.length - 1].net_profit_ytd) : 0
  const distributed = months.reduce((s, m) => s + (m.decision_status === 'approved' ? toAmount(m.distributed) : 0), 0)

  return (
    <div className="space-y-5">
      {error && <InfoNote tone="red">{error}</InfoNote>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label={`Laba Bersih YTD ${year}`} value={ytdProfit} />
        <MiniStat label="Laba Dibagikan" value={distributed} tone="green" />
        <MiniStat label="Laba Ditahan" value={ytdProfit - distributed} tone="amber" />
        <MiniStat label="Dividend Payout Ratio" value={ytdProfit > 0 ? formatPercent(distributed / ytdProfit) : '–'} />
      </div>

      <Card>
        <CardHeader
          title="Informasi Laba Rugi Bersih per Bulan"
          description={months[0] ? `Check point aman bila saldo kas akhir ≥ minimum cash ${formatCurrency(toAmount(months[0].minimum_cash))}` : undefined}
        />
        <TableWrap>
          <thead>
            <tr>
              <th>Bulan</th>
              <th>Quarter</th>
              <th className="text-right">Saldo Kas Akhir</th>
              <th>Check Point</th>
              <th className="text-right">Laba Rugi Usaha</th>
              <th>Status</th>
              <th>Tgl Keputusan</th>
              <th className="text-right">Laba Ditahan</th>
              <th className="text-right">Laba Dibagikan</th>
              <th className="text-right">DPR</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {months.map(m => (
              <tr key={m.month}>
                <td className="font-semibold">{monthNames[m.month - 1]}</td>
                <td>{m.quarter}</td>
                <td className="money">{formatCurrency(toAmount(m.cash_balance))}</td>
                <td>
                  {toAmount(m.net_profit) === 0 && toAmount(m.cash_balance) === 0 ? (
                    <span className="text-slate-400">–</span>
                  ) : (
                    <Status tone={m.is_safe ? 'green' : 'red'}>{m.is_safe ? '✅ Dividen Aman' : '❌ Tidak Aman'}</Status>
                  )}
                </td>
                <td className="money">{formatAccountingCurrency(toAmount(m.net_profit))}</td>
                <td>
                  {m.decision_status ? (
                    <Status tone={m.decision_status === 'approved' ? 'green' : 'amber'}>{decisionLabel[m.decision_status]}</Status>
                  ) : (
                    <span className="text-slate-500">Tidak Dibagikan</span>
                  )}
                </td>
                <td>{m.decision_date ? formatDate(m.decision_date) : '–'}</td>
                <td className="money">{formatAccountingCurrency(toAmount(m.retained))}</td>
                <td className="money">{formatCurrencyOrDash(toAmount(m.distributed))}</td>
                <td className="money">{m.payout_ratio === null ? '–' : formatPercent(m.payout_ratio)}</td>
                <td>
                  {permissions.can('dividends.write') && !m.decision_status && toAmount(m.net_profit) > 0 && (
                    <button type="button" className="text-xs font-semibold text-blue-700" onClick={() => setProposing(m)}>
                      Ajukan
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
        <p className="px-5 py-3 text-[11px] text-slate-500">
          Laba Ditahan = Laba Rugi Usaha − Laba Dibagikan · DPR = Laba Dibagikan / Laba Rugi Usaha.
        </p>
      </Card>

      {permissions.can('dividends.write') && (
        <div className="flex justify-end">
          <Button onClick={() => setProposing(months.find(m => !m.decision_status && toAmount(m.net_profit) > 0) ?? months[new Date().getMonth()] ?? null)}>
            Ajukan Pembagian
          </Button>
        </div>
      )}

      {proposing && (
        <ProposalDrawer
          checkpoint={proposing}
          onClose={() => setProposing(null)}
          onSaved={() => {
            setProposing(null)
            reload()
            onProposed()
          }}
        />
      )}
    </div>
  )
}
