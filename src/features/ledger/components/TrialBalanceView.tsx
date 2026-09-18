import { useCallback } from 'react'
import { Card, CardHeader, EmptyState, InfoNote, TableWrap } from '@/components/common'
import { useAsync } from '@/hooks/useAsync'
import { formatAccountingCurrency, formatCurrency, formatDate, toAmount } from '@/lib'
import { ledgerService, type LedgerRange } from '@/services/ledgerService'

type Props = LedgerRange & {
  onOpenAccount: (accountId: number) => void
}

/**
 * Neraca saldo: saldo awal, mutasi, dan saldo akhir setiap akun yang bergerak.
 *
 * Total debit dan kredit mutasi harus sama — itulah pemeriksaan bahwa seluruh
 * jurnal seimbang. Saldo ditampilkan menurut saldo normal akun, sehingga
 * saldo negatif berarti akun bergerak berlawanan dengan arah normalnya.
 */
export function TrialBalanceView({ from, to, onOpenAccount }: Props) {
  const load = useCallback(() => ledgerService.trialBalance({ from, to }), [from, to])
  const { data: rows, error, isLoading } = useAsync(load)

  if (error) return <InfoNote tone="red">{error}</InfoNote>
  if (!rows) return isLoading ? <p className="text-xs text-slate-500">Memuat...</p> : null

  const totals = rows.reduce(
    (sum, row) => ({
      debit: sum.debit + toAmount(row.debit),
      credit: sum.credit + toAmount(row.credit),
    }),
    { debit: 0, credit: 0 },
  )
  const difference = Math.round((totals.debit - totals.credit) * 100) / 100

  return (
    <Card>
      <CardHeader
        title="Neraca Saldo"
        description={`${formatDate(from)} – ${formatDate(to)} · ${rows.length} akun bergerak`}
      />
      {difference !== 0 && (
        <div className="px-5 pb-4">
          <InfoNote tone="red" variant="inset">
            Total debit dan kredit mutasi berbeda {formatCurrency(Math.abs(difference))}. Ada jurnal
            yang tidak seimbang — periksa Jurnal Umum.
          </InfoNote>
        </div>
      )}
      {rows.length === 0 ? (
        <EmptyState title="Tidak ada mutasi" description="Belum ada jurnal pada rentang tanggal ini." />
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <th>Kode</th>
              <th>Akun</th>
              <th>Kategori</th>
              <th className="text-right">Saldo Awal</th>
              <th className="text-right">Debit</th>
              <th className="text-right">Kredit</th>
              <th className="text-right">Saldo Akhir</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.account.id}>
                <td>
                  <button
                    type="button"
                    className="font-semibold text-blue-700"
                    onClick={() => onOpenAccount(row.account.id)}
                  >
                    {row.account.code}
                  </button>
                </td>
                <td className="font-medium text-slate-800">{row.account.name}</td>
                <td className="text-slate-500">{row.account.category?.name ?? '–'}</td>
                <td className="money">{formatAccountingCurrency(toAmount(row.opening_balance))}</td>
                <td className="money">{formatCurrency(toAmount(row.debit))}</td>
                <td className="money">{formatCurrency(toAmount(row.credit))}</td>
                <td className="money !text-blue-700">
                  {formatAccountingCurrency(toAmount(row.closing_balance))}
                </td>
              </tr>
            ))}
            <tr className="bg-slate-50 font-bold">
              <td colSpan={4} className="text-slate-700">
                Total Mutasi
              </td>
              <td className="money">{formatCurrency(totals.debit)}</td>
              <td className="money">{formatCurrency(totals.credit)}</td>
              <td />
            </tr>
          </tbody>
        </TableWrap>
      )}
    </Card>
  )
}
