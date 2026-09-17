import { Card, CardHeader, Status, TableWrap } from '@/components/common'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib'
import { depreciationJournal, depreciationSummary } from '@/mocks/assets'

/**
 * Rekap depresiasi bulanan per jenis aset.
 *
 * Jurnal depresiasi diposting otomatis pada akhir bulan dengan tagging
 * `Non Kas & Bank`, sehingga tidak memengaruhi Laporan Arus Kas.
 */
export function DepreciationTab() {
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_.7fr]">
      <Card>
        <CardHeader
          title={`Depresiasi ${depreciationJournal.period}`}
          description="Rekap beban penyusutan per jenis aset"
        />
        <TableWrap>
          <thead>
            <tr>
              <th>Jenis Aset</th>
              <th className="text-right">Nilai Aset</th>
              <th className="text-right">Beban Depresiasi</th>
            </tr>
          </thead>
          <tbody>
            {depreciationSummary.map(row => (
              <tr key={row.assetType}>
                <td className="font-semibold">{row.assetType}</td>
                <td className="money">{formatCurrency(row.assetValue)}</td>
                <td className="money">{formatCurrency(row.depreciationExpense)}</td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-bold text-slate-900">Preview Jurnal Depresiasi</h2>
        <p className="mt-1 text-xs text-slate-500">
          Belum diposting untuk {depreciationJournal.period}
        </p>

        <div className="mt-4 rounded-xl bg-slate-50 p-4 text-xs leading-7">
          <div className="flex justify-between">
            <span>D · Beban Penyusutan</span>
            <b>{formatCurrency(depreciationJournal.amount)}</b>
          </div>
          <div className="flex justify-between">
            <span>K · Akumulasi Penyusutan</span>
            <b>{formatCurrency(depreciationJournal.amount)}</b>
          </div>
        </div>

        <div className="mt-4">
          <Status tone={depreciationJournal.posted ? 'green' : 'amber'}>
            {depreciationJournal.posted ? 'Sudah Diposting' : 'Menunggu Posting'}
          </Status>
        </div>
        <Button className="mt-5 w-full">Preview Jurnal Depresiasi</Button>
      </Card>
    </div>
  )
}
