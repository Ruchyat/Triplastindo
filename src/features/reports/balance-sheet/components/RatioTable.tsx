import { Card, CardHeader, Status, TableWrap } from '@/components/common'
import { formatPercent } from '@/lib'
import type { ApiFinancialRatio, Tone } from '@/types'

const verdictTone: Record<ApiFinancialRatio['verdict'], Tone> = {
  good: 'green',
  bad: 'red',
  info: 'blue',
}

const verdictLabel: Record<ApiFinancialRatio['verdict'], string> = {
  good: 'Good',
  bad: 'Bad',
  info: 'Info',
}

const numberFormatter = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 })

function formatValue(ratio: ApiFinancialRatio, value: number | null): string {
  if (value === null) return '–'
  return ratio.format === 'percent' ? formatPercent(value) : numberFormatter.format(value)
}

/** Rasio keuangan YTD dibandingkan terhadap standar yang dipakai di sheet. */
export function RatioTable({ ratios }: { ratios: ApiFinancialRatio[] }) {
  return (
    <Card>
      <CardHeader
        title="Rasio Keuangan YTD"
        description="Dihitung dari neraca per tanggal ini dan laba rugi serta arus kas sejak Januari"
      />
      <TableWrap>
        <thead>
          <tr>
            <th>Rasio</th>
            <th className="text-right">Nilai</th>
            <th className="text-right">Standar</th>
            <th>Status</th>
            <th>Keterangan</th>
          </tr>
        </thead>
        <tbody>
          {ratios.map(ratio => (
            <tr key={ratio.key}>
              <td className="font-semibold text-slate-800">{ratio.name}</td>
              <td className="money">{formatValue(ratio, ratio.value)}</td>
              <td className="money">
                {ratio.standard === null
                  ? '–'
                  : `${ratio.direction === 'min' ? '≥' : '≤'} ${formatValue(ratio, ratio.standard)}`}
              </td>
              <td>
                <Status tone={verdictTone[ratio.verdict]}>{verdictLabel[ratio.verdict]}</Status>
              </td>
              <td className="text-slate-500">{ratio.hint}</td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
    </Card>
  )
}
