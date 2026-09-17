import { Card, FilterBar, InfoNote, MiniStat, Select, Status, TableWrap } from '@/components/common'
import { formatCurrency, formatCurrencyOrDash } from '@/lib'
import type { DepositActivity, DepositSource, Tone } from '@/types'

type Props = {
  activities: DepositActivity[]
  summary: {
    totalBalance: number
    receivedThisMonth: number
    appliedOrRefunded: number
  }
  /** Sembunyikan catatan penjelas bila halaman sudah menampilkannya di atas. */
  showNote?: boolean
}

const sourceTone: Record<DepositSource, Tone> = {
  Invoice: 'blue',
  Refund: 'amber',
  Bank: 'green',
  'Saldo Awal': 'green',
}

/** Kartu deposit pelanggan: uang masuk, pemakaian pada invoice, dan saldo berjalan. */
export function DepositTable({ activities, summary, showNote = true }: Props) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        <MiniStat label="Total Saldo Deposit" value={summary.totalBalance} />
        <MiniStat label="Deposit Masuk Bulan Ini" value={summary.receivedThisMonth} tone="green" />
        <MiniStat label="Digunakan / Dikembalikan" value={summary.appliedOrRefunded} tone="amber" />
      </div>

      <Card>
        {showNote && (
          <InfoNote variant="inset">
            Deposit pelanggan dicatat sebagai <b>kewajiban</b>, bukan pendapatan. Saldo baru menjadi
            bagian pembayaran ketika digunakan pada invoice.
          </InfoNote>
        )}

        <FilterBar>
          <Select>
            <option>Semua Customer</option>
          </Select>
          <Select>
            <option>Semua Aktivitas</option>
          </Select>
          <Select>
            <option>September 2026</option>
          </Select>
        </FilterBar>

        <TableWrap>
          <thead>
            <tr>
              <th>No. Deposit</th>
              <th>Tanggal</th>
              <th>Customer</th>
              <th>Keterangan</th>
              <th className="text-right">Masuk</th>
              <th className="text-right">Terpakai/Kembali</th>
              <th className="text-right">Saldo</th>
              <th>Sumber</th>
            </tr>
          </thead>
          <tbody>
            {activities.map(activity => (
              <tr key={activity.number}>
                <td className="font-semibold text-blue-700">{activity.number}</td>
                <td>{activity.date}</td>
                <td className="font-semibold">{activity.customer}</td>
                <td>{activity.description}</td>
                <td className="money !text-emerald-700">{formatCurrencyOrDash(activity.received)}</td>
                <td className="money !text-amber-700">{formatCurrencyOrDash(activity.applied)}</td>
                <td className="money">{formatCurrency(activity.balance)}</td>
                <td>
                  <Status tone={sourceTone[activity.source]}>{activity.source}</Status>
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Card>
    </>
  )
}
