import {
  Card,
  CardHeader,
  Field,
  Input,
  MiniStat,
  Select,
  Status,
  TableWrap,
  Textarea,
} from '@/components/common'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatNumber } from '@/lib'
import { profitSharingCheckpoint, shareholderAllocations } from '@/mocks/profit-sharing'

/**
 * Tab Keputusan Pembagian.
 *
 * Check point memastikan saldo kas akhir masih di atas minimum cash sebelum
 * laba boleh dibagikan kepada pemegang saham.
 */
export function DividendDecisionTab() {
  const { closingCash, minimumCash, safe, netProfit } = profitSharingCheckpoint

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Saldo Kas Akhir" value={closingCash} />
        <MiniStat label="Minimum Cash" value={minimumCash} />
        <MiniStat
          label="Check Point"
          value={safe ? 'AMAN' : 'TIDAK AMAN'}
          tone={safe ? 'green' : 'red'}
          hint={safe ? 'Kas tersedia untuk pembagian' : 'Kas di bawah batas minimum'}
        />
        <MiniStat label="Laba Bersih" value={netProfit} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[.7fr_1.3fr]">
        <ProposalForm />
        <AllocationTable />
      </div>
    </>
  )
}

function ProposalForm() {
  return (
    <Card className="p-5">
      <h2 className="text-sm font-bold text-slate-900">Ajukan Pembagian</h2>
      <div className="mt-5 space-y-4">
        <Field label="Periode">
          <Select className="w-full">
            <option>September 2026</option>
          </Select>
        </Field>
        <Field label="Total Dividen">
          <Input placeholder="Rp 100.000.000" />
        </Field>
        <Field label="Tanggal Keputusan">
          <Input type="date" />
        </Field>
        <Field label="Catatan">
          <Textarea className="min-h-20" placeholder="Catatan pengajuan" />
        </Field>
        <Button className="w-full">Ajukan untuk Approval</Button>
      </div>
    </Card>
  )
}

function AllocationTable() {
  return (
    <Card>
      <CardHeader
        title="Alokasi Dividen"
        description="Simulasi dividen berdasarkan komposisi saham"
        action={<Status tone="amber">Draft</Status>}
      />
      <TableWrap>
        <thead>
          <tr>
            <th>Pemegang Saham</th>
            <th className="text-right">Saham</th>
            <th className="text-right">Share</th>
            <th className="text-right">Bruto</th>
            <th className="text-right">Pajak 10%</th>
            <th className="text-right">Net</th>
          </tr>
        </thead>
        <tbody>
          {shareholderAllocations.map(allocation => (
            <tr key={allocation.name}>
              <td className="font-semibold">{allocation.name}</td>
              <td className="money">{formatNumber(allocation.shares)}</td>
              <td className="money">{allocation.sharePercentage}</td>
              <td className="money">{formatCurrency(allocation.gross)}</td>
              <td className="money">{formatCurrency(allocation.tax)}</td>
              <td className="money !text-emerald-700">{formatCurrency(allocation.net)}</td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
    </Card>
  )
}
