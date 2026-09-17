import {
  Card,
  FilterBar,
  InfoNote,
  MiniStat,
  PageHeader,
  Select,
  Status,
  TableFooterNote,
  TableWrap,
} from '@/components/common'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib'
import { paymentStatusTone, type SubledgerCard } from '@/types'

export type SubledgerKind = 'payable' | 'receivable'

type Summary = {
  total: number
  settled: number
  outstanding: number
  ratioLabel: string
}

type Props = {
  kind: SubledgerKind
  cards: SubledgerCard[]
  summary: Summary
  /** Kartu umur piutang; hanya dipakai pada sub-ledger piutang. */
  aging?: { label: string; amount: number }[]
}

const copy = {
  payable: {
    eyebrow: 'Keuangan / Utang',
    title: 'Utang Usaha',
    description: 'Kewajiban otomatis dari tagihan pembelian kredit',
    sourceAction: 'Buka Pembelian',
    note: 'Utang dibuat otomatis ketika tagihan pembelian kredit diposting.',
    totalLabel: 'Total Utang',
    settledLabel: 'Terbayar',
    outstandingLabel: 'Outstanding',
    ratioLabel: 'Persentase Terbayar',
    numberColumn: 'No. Hutang',
    partyColumn: 'Kreditur',
    partyFilter: 'Semua Kreditur',
  },
  receivable: {
    eyebrow: 'Keuangan / Piutang',
    title: 'Piutang Usaha',
    description: 'Hak tagih otomatis dari invoice penjualan kredit',
    sourceAction: 'Buka Penjualan',
    note: 'Piutang dibuat otomatis ketika invoice penjualan kredit diposting.',
    totalLabel: 'Total Piutang',
    settledLabel: 'Tertagih',
    outstandingLabel: 'Belum Tertagih',
    ratioLabel: 'Collection Rate',
    numberColumn: 'No. Piutang',
    partyColumn: 'Debitur',
    partyFilter: 'Semua Debitur',
  },
} as const

/**
 * Tampilan sub-ledger utang dan piutang.
 *
 * Keduanya berbagi struktur yang sama karena datanya sama-sama dibentuk
 * otomatis dari dokumen asal — Finance tidak membuat kartunya secara manual.
 */
export function SubledgerView({ kind, cards, summary, aging }: Props) {
  const text = copy[kind]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={text.eyebrow}
        title={text.title}
        description={text.description}
        actions={<Button variant="outline">{text.sourceAction}</Button>}
      />

      <InfoNote>
        {text.note} Pembayaran dilakukan melalui menu <b>Kas &amp; Bank</b>.
      </InfoNote>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label={text.totalLabel} value={summary.total} />
        <MiniStat label={text.settledLabel} value={summary.settled} tone="green" />
        <MiniStat label={text.outstandingLabel} value={summary.outstanding} tone="amber" />
        <MiniStat label={text.ratioLabel} value={summary.ratioLabel} />
      </div>

      {aging && (
        <div className="grid gap-3 sm:grid-cols-4">
          {aging.map(bucket => (
            <MiniStat
              key={bucket.label}
              label={bucket.label}
              value={bucket.amount}
              tone={bucket.amount === 0 ? 'green' : 'amber'}
            />
          ))}
        </div>
      )}

      <Card>
        <FilterBar>
          <Select>
            <option>{text.partyFilter}</option>
          </Select>
          <Select>
            <option>Semua Status</option>
          </Select>
          <Select>
            <option>September 2026</option>
          </Select>
        </FilterBar>

        <TableWrap>
          <thead>
            <tr>
              <th>{text.numberColumn}</th>
              <th>{text.partyColumn}</th>
              <th>Tanggal</th>
              <th>Jatuh Tempo</th>
              <th className="text-right">Nominal</th>
              <th className="text-right">Terbayar</th>
              <th className="text-right">Sisa</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {cards.map(card => (
              <tr key={card.number}>
                <td className="font-semibold text-blue-700">{card.number}</td>
                <td className="font-semibold text-slate-800">{card.party}</td>
                <td>{card.date}</td>
                <td>{card.dueDate}</td>
                <td className="money">{formatCurrency(card.amount)}</td>
                <td className="money">{formatCurrency(card.paid)}</td>
                <td className="money">{formatCurrency(card.amount - card.paid)}</td>
                <td>
                  <Status tone={paymentStatusTone[card.status]}>{card.status}</Status>
                </td>
                <td>
                  <button className="font-semibold text-blue-700">Detail</button>
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>

        <TableFooterNote>
          <span>{cards.length} data ditemukan</span>
          <span>Dibentuk otomatis dari transaksi asal</span>
        </TableFooterNote>
      </Card>
    </div>
  )
}
