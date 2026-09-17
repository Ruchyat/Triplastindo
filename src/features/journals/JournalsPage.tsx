import { Fragment, useState } from 'react'
import { ChevronDown, Download, Printer } from 'lucide-react'
import {
  Card,
  FilterBar,
  MiniStat,
  PageHeader,
  Select,
  Status,
  TableFooterNote,
  TableWrap,
} from '@/components/common'
import { Button } from '@/components/ui/Button'
import { cn, formatCurrency } from '@/lib'
import { journalEntries, journalSummary } from '@/mocks/journals'
import { JournalDetailRow } from './components/JournalDetailRow'

/**
 * Halaman Jurnal Umum.
 *
 * Pusat data keuangan aplikasi. Seluruh laporan dihitung dari jurnal ini,
 * dan jurnal yang tidak seimbang tidak boleh tersimpan.
 */
export function JournalsPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Transaksi / Jurnal Umum"
        title="Jurnal Umum"
        description="Seluruh transaksi double-entry Triplastindo"
        actions={
          <>
            <Button variant="outline">
              <Download size={15} />
              Export
            </Button>
            <Button variant="outline">
              <Printer size={15} />
              Print
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <MiniStat label="Total Debit September" value={journalSummary.totalDebit} />
        <MiniStat label="Total Kredit September" value={journalSummary.totalCredit} />
        <MiniStat
          label="Status Jurnal"
          value="Balance"
          tone="green"
          hint="Tidak ada jurnal tidak seimbang"
        />
      </div>

      <Card>
        <FilterBar>
          <Select>
            <option>September 2026</option>
          </Select>
          <Select>
            <option>Semua Akun</option>
          </Select>
          <Select>
            <option>Semua Kategori</option>
          </Select>
          <Select>
            <option>Semua Tagging</option>
          </Select>
        </FilterBar>

        <TableWrap>
          <thead>
            <tr>
              <th>No. Bukti</th>
              <th>Tanggal</th>
              <th>Keterangan</th>
              <th>Akun</th>
              <th className="text-right">Debit</th>
              <th className="text-right">Kredit</th>
              <th>Tagging</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {journalEntries.map((entry, index) => (
              <Fragment key={entry.number}>
                <tr
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="cursor-pointer"
                >
                  <td className="font-semibold text-blue-700">{entry.number}</td>
                  <td>{entry.date}</td>
                  <td className="font-medium text-slate-800">{entry.description}</td>
                  <td>{entry.accounts}</td>
                  <td className="money">{formatCurrency(entry.debit)}</td>
                  <td className="money">{formatCurrency(entry.credit)}</td>
                  <td>
                    <Status tone={entry.tagging === 'Kas & Bank' ? 'blue' : 'slate'}>
                      {entry.tagging}
                    </Status>
                  </td>
                  <td>
                    <ChevronDown
                      size={15}
                      className={cn('transition', openIndex === index && 'rotate-180')}
                    />
                  </td>
                </tr>
                {openIndex === index && <JournalDetailRow entry={entry} />}
              </Fragment>
            ))}
          </tbody>
        </TableWrap>

        <TableFooterNote>
          <span>
            Menampilkan 1–{journalEntries.length} dari {journalSummary.totalEntries} jurnal
          </span>
          <div className="flex gap-1">
            <Button variant="outline">Sebelumnya</Button>
            <Button variant="outline">Berikutnya</Button>
          </div>
        </TableFooterNote>
      </Card>
    </div>
  )
}
