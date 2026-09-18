import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  Combobox,
  EmptyState,
  FilterBar,
  InfoNote,
  MiniStat,
  PageHeader,
  Status,
  TableFooterNote,
  TableWrap,
} from '@/components/common'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDate, formatRatioPercent } from '@/lib'
import { documentStatusTone, type ApiDocumentStatus } from '@/types'

export type SubledgerKind = 'payable' | 'receivable'

/** Satu kartu utang atau piutang: dokumen asal beserta posisi pembayarannya. */
export type SubledgerRow = {
  id: number
  number: string
  party: string
  date: string
  dueDate: string | null
  amount: number
  paid: number
  status: ApiDocumentStatus
  statusLabel: string
}

export type SubledgerFilters = {
  partyId?: number
  status: 'outstanding' | 'paid' | ''
}

type Props = {
  kind: SubledgerKind
  summary?: { total: number; settled: number; outstanding: number }
  rows: SubledgerRow[]
  isLoading: boolean
  error?: string | null
  parties: { value: string; label: string; description?: string }[]
  filters: SubledgerFilters
  onFilterChange: (filters: SubledgerFilters) => void
  /** Membuka dokumen asalnya. */
  onOpen: (id: number) => void
  /** Membuka form pelunasan dengan dokumen ini sudah tercentang. */
  onSettle: (row: SubledgerRow) => void
  /** Halaman modul asal, untuk tombol di kepala halaman. */
  sourcePath: string
  /** Kartu umur piutang; hanya dipakai pada sub-ledger piutang. */
  aging?: ReactNode
}

const copy = {
  payable: {
    eyebrow: 'Keuangan / Utang',
    title: 'Utang Usaha',
    description: 'Kewajiban otomatis dari tagihan pembelian bertermin',
    sourceAction: 'Buka Pembelian',
    note: 'Utang dibuat otomatis ketika tagihan pembelian bertermin diposting, dan berkurang oleh Pembayaran Supplier.',
    totalLabel: 'Total Pembelian',
    settledLabel: 'Terbayar',
    outstandingLabel: 'Sisa Utang',
    ratioLabel: 'Persentase Terbayar',
    numberColumn: 'No. Tagihan',
    partyColumn: 'Supplier',
    partyFilter: 'Semua Supplier',
    settleAction: 'Bayar',
    empty: 'Tidak ada tagihan yang cocok dengan penyaring ini.',
  },
  receivable: {
    eyebrow: 'Keuangan / Piutang',
    title: 'Piutang Usaha',
    description: 'Hak tagih otomatis dari invoice penjualan bertermin',
    sourceAction: 'Buka Penjualan',
    note: 'Piutang dibuat otomatis ketika invoice penjualan bertermin diposting, dan berkurang oleh Penerimaan Pembayaran.',
    totalLabel: 'Total Penjualan',
    settledLabel: 'Tertagih',
    outstandingLabel: 'Sisa Piutang',
    ratioLabel: 'Collection Rate',
    numberColumn: 'No. Invoice',
    partyColumn: 'Customer',
    partyFilter: 'Semua Customer',
    settleAction: 'Terima',
    empty: 'Tidak ada invoice yang cocok dengan penyaring ini.',
  },
} as const

const statusOptions = [
  { value: 'outstanding', label: 'Belum Lunas' },
  { value: 'paid', label: 'Lunas' },
  { value: '', label: 'Semua' },
]

/**
 * Tampilan sub-ledger utang dan piutang.
 *
 * Keduanya berbagi struktur yang sama karena datanya sama-sama dibentuk
 * otomatis dari dokumen asal — Finance tidak membuat kartunya secara manual.
 * Barisnya adalah dokumen itu sendiri; membukanya berpindah ke halaman
 * dokumen, dan melunasinya membuka form pelunasan yang sudah terisi.
 */
export function SubledgerView({
  kind,
  summary,
  rows,
  isLoading,
  error,
  parties,
  filters,
  onFilterChange,
  onOpen,
  onSettle,
  sourcePath,
  aging,
}: Props) {
  const text = copy[kind]
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={text.eyebrow}
        title={text.title}
        description={text.description}
        actions={
          <Button variant="outline" onClick={() => navigate(sourcePath)}>
            {text.sourceAction}
          </Button>
        }
      />

      <InfoNote>{text.note}</InfoNote>
      {error && <InfoNote tone="red">{error}</InfoNote>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label={text.totalLabel} value={summary?.total ?? '–'} />
        <MiniStat label={text.settledLabel} value={summary?.settled ?? '–'} tone="green" />
        <MiniStat label={text.outstandingLabel} value={summary?.outstanding ?? '–'} tone="amber" />
        <MiniStat
          label={text.ratioLabel}
          value={summary ? formatRatioPercent(summary.settled, summary.total) : '–'}
        />
      </div>

      {aging}

      <Card>
        <FilterBar search={false}>
          <Combobox
            className="w-56"
            aria-label={text.partyFilter}
            options={[{ value: '', label: text.partyFilter }, ...parties]}
            value={filters.partyId ? String(filters.partyId) : ''}
            onChange={value =>
              onFilterChange({ ...filters, partyId: value ? Number(value) : undefined })
            }
          />
          <Combobox
            className="w-40"
            aria-label="Filter status"
            clearable={false}
            options={statusOptions}
            value={filters.status}
            onChange={value =>
              onFilterChange({ ...filters, status: value as SubledgerFilters['status'] })
            }
          />
        </FilterBar>

        {rows.length === 0 && !isLoading ? (
          <EmptyState title="Tidak ada data" description={text.empty} />
        ) : (
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
              {rows.map(row => {
                const isOutstanding = row.status === 'unpaid' || row.status === 'partial' || row.status === 'overdue'
                return (
                  <tr key={row.id}>
                    <td>
                      <button
                        type="button"
                        className="font-semibold text-blue-700"
                        onClick={() => onOpen(row.id)}
                      >
                        {row.number}
                      </button>
                    </td>
                    <td className="font-semibold text-slate-800">{row.party}</td>
                    <td>{formatDate(row.date)}</td>
                    <td>{formatDate(row.dueDate)}</td>
                    <td className="money">{formatCurrency(row.amount)}</td>
                    <td className="money">{formatCurrency(row.paid)}</td>
                    <td className="money">{formatCurrency(row.amount - row.paid)}</td>
                    <td>
                      <Status tone={documentStatusTone[row.status]}>{row.statusLabel}</Status>
                    </td>
                    <td>
                      {isOutstanding && (
                        <button
                          type="button"
                          className="font-semibold text-blue-700"
                          onClick={() => onSettle(row)}
                        >
                          {text.settleAction}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </TableWrap>
        )}

        <TableFooterNote>
          <span>{rows.length} data ditemukan</span>
          <span>Dibentuk otomatis dari transaksi asal</span>
        </TableFooterNote>
      </Card>
    </div>
  )
}
