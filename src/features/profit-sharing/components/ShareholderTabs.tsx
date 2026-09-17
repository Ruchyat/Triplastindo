import { Card, CardHeader, Status, TableWrap } from '@/components/common'
import { formatCurrency, formatNumber } from '@/lib'
import { dividendHistory, shareholderAllocations } from '@/mocks/profit-sharing'

/** Daftar pemegang saham beserta persentase kepemilikannya. */
export function ShareholderListTab() {
  return (
    <Card>
      <CardHeader title="Daftar Pemegang Saham" description="Total 3.600.000 lembar saham" />
      <TableWrap>
        <thead>
          <tr>
            <th>Nama</th>
            <th className="text-right">Jumlah Saham</th>
            <th className="text-right">Persentase</th>
          </tr>
        </thead>
        <tbody>
          {shareholderAllocations.map(shareholder => (
            <tr key={shareholder.name}>
              <td className="font-semibold">{shareholder.name}</td>
              <td className="money">{formatNumber(shareholder.shares)}</td>
              <td className="money">{shareholder.sharePercentage}</td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
    </Card>
  )
}

/** Riwayat keputusan pembagian laba yang sudah disetujui direksi. */
export function DividendHistoryTab() {
  return (
    <Card>
      <CardHeader title="Riwayat Dividen" description="Keputusan pembagian laba yang sudah tercatat" />
      <TableWrap>
        <thead>
          <tr>
            <th>Periode</th>
            <th>Tanggal Keputusan</th>
            <th className="text-right">Laba</th>
            <th className="text-right">Dibagikan</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {dividendHistory.map(record => (
            <tr key={record.period}>
              <td className="font-semibold">{record.period}</td>
              <td>{record.decisionDate}</td>
              <td className="money">{formatCurrency(record.profit)}</td>
              <td className="money">{formatCurrency(record.distributed)}</td>
              <td>
                <Status tone="green">{record.status}</Status>
              </td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
    </Card>
  )
}
