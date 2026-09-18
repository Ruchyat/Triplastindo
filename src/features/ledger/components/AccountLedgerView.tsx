import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { routePaths } from '@/app/router'
import { Card, CardHeader, EmptyState, InfoNote, MiniStat, TableWrap } from '@/components/common'
import { useAsync } from '@/hooks/useAsync'
import { formatCurrency, formatCurrencyOrDash, formatDate, toAmount } from '@/lib'
import { ledgerService, type LedgerRange } from '@/services/ledgerService'

type Props = {
  accountId: number
} & LedgerRange

/** Mutasi satu akun beserta saldo berjalannya. */
export function AccountLedgerView({ accountId, from, to }: Props) {
  const load = useCallback(() => ledgerService.account(accountId, { from, to }), [accountId, from, to])
  const { data: ledger, error, isLoading } = useAsync(load)

  if (error) return <InfoNote tone="red">{error}</InfoNote>
  if (!ledger) return isLoading ? <p className="text-xs text-slate-500">Memuat...</p> : null

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Saldo Awal" value={toAmount(ledger.opening_balance)} />
        <MiniStat label="Total Debit" value={toAmount(ledger.total_debit)} tone="green" />
        <MiniStat label="Total Kredit" value={toAmount(ledger.total_credit)} tone="amber" />
        <MiniStat label="Saldo Akhir" value={toAmount(ledger.closing_balance)} tone="blue" />
      </div>

      <Card>
        <CardHeader
          title={ledger.account.label}
          description={`Saldo normal ${ledger.account.normal_balance_label} · ${formatDate(from)} – ${formatDate(to)}`}
        />
        {ledger.lines.length === 0 ? (
          <EmptyState
            title="Tidak ada mutasi"
            description="Akun ini tidak bergerak pada rentang tanggal tersebut."
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>No. Jurnal</th>
                <th>Sumber</th>
                <th>Deskripsi</th>
                <th className="text-right">Debit</th>
                <th className="text-right">Kredit</th>
                <th className="text-right">Saldo</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-slate-50/60">
                <td colSpan={6} className="font-semibold text-slate-600">
                  Saldo awal
                </td>
                <td className="money">{formatCurrency(toAmount(ledger.opening_balance))}</td>
              </tr>
              {ledger.lines.map(line => (
                <tr key={line.id}>
                  <td>{formatDate(line.date)}</td>
                  <td>
                    {line.journal_number && (
                      <Link
                        to={`${routePaths.journals}?search=${encodeURIComponent(line.journal_number)}&month=${line.date.slice(0, 7)}`}
                        className="font-semibold text-blue-700"
                      >
                        {line.journal_number}
                      </Link>
                    )}
                  </td>
                  <td className="text-slate-500">
                    {line.source_label}
                    {line.source_number && (
                      <span className="block text-[10px]">{line.source_number}</span>
                    )}
                  </td>
                  <td className="font-medium text-slate-800">{line.description}</td>
                  <td className="money">{formatCurrencyOrDash(toAmount(line.debit))}</td>
                  <td className="money">{formatCurrencyOrDash(toAmount(line.credit))}</td>
                  <td className="money !text-blue-700">{formatCurrency(toAmount(line.balance))}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>
    </>
  )
}
