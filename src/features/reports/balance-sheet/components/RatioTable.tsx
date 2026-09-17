import { Card, CardHeader, Status, TableWrap } from '@/components/common'
import { financialRatios } from '@/mocks/reports'
import type { FinancialRatio, Tone } from '@/types'

const verdictTone: Record<FinancialRatio['verdict'], Tone> = {
  good: 'green',
  bad: 'red',
  info: 'blue',
}

const verdictLabel: Record<FinancialRatio['verdict'], string> = {
  good: 'Good',
  bad: 'Bad',
  info: 'Info',
}

/** Rasio keuangan YTD dibandingkan terhadap standar yang diatur di Setup. */
export function RatioTable() {
  return (
    <Card>
      <CardHeader
        title="Rasio Keuangan YTD"
        description="Dibandingkan dengan standar perusahaan pada menu Setup"
      />
      <TableWrap>
        <thead>
          <tr>
            <th>Rasio</th>
            <th className="text-right">Nilai</th>
            <th className="text-right">Standar</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {financialRatios.map(ratio => (
            <tr key={ratio.name}>
              <td className="font-semibold text-slate-800">{ratio.name}</td>
              <td className="money">{ratio.value}</td>
              <td className="money">{ratio.standard}</td>
              <td>
                <Status tone={verdictTone[ratio.verdict]}>{verdictLabel[ratio.verdict]}</Status>
              </td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
    </Card>
  )
}
