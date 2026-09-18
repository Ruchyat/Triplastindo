import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Download, Printer } from 'lucide-react'
import {
  Card,
  EmptyState,
  FilterBar,
  InfoNote,
  Input,
  MiniStat,
  PageHeader,
  Select,
  TableFooterNote,
  TableWrap,
} from '@/components/common'
import { Button } from '@/components/ui/Button'
import { useAsync } from '@/hooks/useAsync'
import { toAmount } from '@/lib'
import { masterDataService } from '@/services/masterDataService'
import { JournalEntryGroup } from './components/JournalEntryGroup'
import { useJournalEntries } from './useJournalEntries'

/** Asal jurnal yang dapat disaring, memakai nilai yang dipakai backend. */
const sourceOptions = [
  { value: '', label: 'Semua Sumber' },
  { value: 'manual', label: 'Jurnal Manual' },
  { value: 'sale', label: 'Penjualan' },
  { value: 'purchase', label: 'Pembelian' },
  { value: 'expense', label: 'Pengeluaran' },
  { value: 'cash_receipt', label: 'Penerimaan Kas' },
  { value: 'cash_payment', label: 'Pembayaran Kas' },
  { value: 'depreciation', label: 'Penyusutan' },
]

/**
 * Halaman Jurnal Umum.
 *
 * Pusat data keuangan aplikasi: seluruh laporan dihitung dari jurnal ini.
 *
 * Satu baris tabel adalah satu sisi debit atau kredit, dikelompokkan per
 * transaksi — bentuk yang sama dengan tab JURNAL UMUM di Google Sheet.
 */
export function JournalsPage() {
  // Transaksi yang accordion-nya sedang terbuka. Satu saja pada satu waktu,
  // supaya tabel tidak kembali terpecah oleh banyak baris tambahan.
  const [openId, setOpenId] = useState<number | null>(null)

  // `?search=JU/2026/09/0001&month=2026-09` — dipakai tautan nomor jurnal dari
  // detail invoice, agar jurnalnya langsung tersaring meski berada di bulan
  // selain bulan berjalan.
  const [searchParams] = useSearchParams()
  const journals = useJournalEntries({
    search: searchParams.get('search') ?? undefined,
    month: searchParams.get('month') ?? undefined,
  })

  const loadAccounts = useCallback(() => masterDataService.accounts(), [])
  const accounts = useAsync(loadAccounts)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Transaksi / Jurnal Umum"
        title="Jurnal Umum"
        description="Seluruh transaksi double-entry Triplastindo"
        actions={
          <>
            <Button variant="outline" disabled>
              <Download size={15} />
              Export
            </Button>
            <Button variant="outline" disabled>
              <Printer size={15} />
              Print
            </Button>
          </>
        }
      />

      {journals.error && <InfoNote tone="red">{journals.error}</InfoNote>}

      <div className="grid gap-3 sm:grid-cols-3">
        <MiniStat label="Total Debit" value={toAmount(journals.summary?.total_debit)} />
        <MiniStat label="Total Kredit" value={toAmount(journals.summary?.total_credit)} />
        <BalanceStat unbalanced={journals.summary?.unbalanced_count ?? 0} />
      </div>

      <Card>
        <FilterBar
          searchValue={journals.filters.search}
          searchPlaceholder="Cari nomor bukti atau keterangan..."
          onSearchChange={value =>
            journals.changeFilters({ ...journals.filters, search: value || undefined })
          }
        >
          <Input
            type="month"
            className="w-auto"
            value={journals.month}
            onChange={event => journals.changeMonth(event.target.value)}
          />

          <Select
            value={journals.filters.accountId ?? ''}
            onChange={event =>
              journals.changeFilters({
                ...journals.filters,
                accountId: event.target.value ? Number(event.target.value) : undefined,
              })
            }
          >
            <option value="">Semua Akun</option>
            {(accounts.data ?? []).map(account => (
              <option key={account.id} value={account.id}>
                {account.label}
              </option>
            ))}
          </Select>

          <Select
            value={journals.filters.tagging ?? ''}
            onChange={event =>
              journals.changeFilters({
                ...journals.filters,
                tagging: event.target.value || undefined,
              })
            }
          >
            <option value="">Semua Tagging</option>
            <option value="kas_bank">Kas &amp; Bank</option>
            <option value="non_kas_bank">Non Kas &amp; Bank</option>
          </Select>

          <Select
            value={journals.filters.source ?? ''}
            onChange={event =>
              journals.changeFilters({
                ...journals.filters,
                source: event.target.value || undefined,
              })
            }
          >
            {sourceOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FilterBar>

        {journals.entries.length === 0 && !journals.isLoading ? (
          <EmptyState
            title="Belum ada jurnal"
            description="Jurnal terbentuk otomatis dari transaksi, atau dibuat lewat Jurnal Manual."
          />
        ) : (
          <>
            <TableWrap>
              <thead>
                <tr>
                  <th>No. Bukti</th>
                  <th>Tanggal</th>
                  <th>COA</th>
                  <th>Nama Akun</th>
                  <th>Kategori Akun</th>
                  <th>Keterangan</th>
                  <th className="text-right">Debit</th>
                  <th className="text-right">Kredit</th>
                </tr>
              </thead>
              <tbody>
                {journals.entries.map(entry => (
                  <JournalEntryGroup
                    key={entry.id}
                    entry={entry}
                    isOpen={openId === entry.id}
                    onToggle={() => setOpenId(openId === entry.id ? null : entry.id)}
                  />
                ))}
              </tbody>
            </TableWrap>

            <TableFooterNote>
              <span>
                Menampilkan {journals.meta?.from ?? 0}–{journals.meta?.to ?? 0} dari{' '}
                {journals.meta?.total ?? 0} transaksi
              </span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  disabled={journals.page <= 1}
                  onClick={() => journals.setPage(journals.page - 1)}
                >
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  disabled={journals.page >= (journals.meta?.last_page ?? 1)}
                  onClick={() => journals.setPage(journals.page + 1)}
                >
                  Berikutnya
                </Button>
              </div>
            </TableFooterNote>
          </>
        )}
      </Card>
    </div>
  )
}

/**
 * Penanda keseimbangan seluruh jurnal.
 *
 * Nilainya seharusnya selalu seimbang — JournalPoster tidak mengizinkan jurnal
 * tidak seimbang tersimpan. Kartu ini tetap ditampilkan sebagai pemeriksaan
 * mandiri: bila angkanya bukan nol, ada yang menulis ke tabel jurnal tanpa
 * melewati poster.
 */
function BalanceStat({ unbalanced }: { unbalanced: number }) {
  return unbalanced === 0 ? (
    <MiniStat
      label="Status Jurnal"
      value="Balance"
      tone="green"
      hint="Tidak ada jurnal tidak seimbang"
    />
  ) : (
    <MiniStat
      label="Status Jurnal"
      value={`${unbalanced} Tidak Balance`}
      tone="red"
      hint="Periksa jurnal yang ditandai"
    />
  )
}
