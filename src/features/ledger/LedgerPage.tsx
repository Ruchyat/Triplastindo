import { Download, Printer } from 'lucide-react'
import {
  Card,
  CardHeader,
  Field,
  Input,
  MiniStat,
  PageHeader,
  Select,
  TableWrap,
} from '@/components/common'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatCurrencyOrDash } from '@/lib'
import { ledgerRows, ledgerSummary } from '@/mocks/journals'

/**
 * Halaman Buku Besar.
 *
 * Menampilkan mutasi dan saldo berjalan satu akun. Saldo dihitung mengikuti
 * saldo normal akun: Debit → D − K, Kredit → K − D.
 */
export function LedgerPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Laporan / Buku Besar"
        title="Buku Besar"
        description="Mutasi dan saldo berjalan per akun"
        actions={
          <>
            <Button variant="outline">
              <Download size={15} />
              Export Excel
            </Button>
            <Button variant="outline">
              <Printer size={15} />
              Print
            </Button>
          </>
        }
      />

      <Card className="p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Pilih Akun">
            <Select className="w-full">
              <option>{ledgerSummary.account}</option>
            </Select>
          </Field>
          <Field label="Periode">
            <Select className="w-full">
              <option>September 2026</option>
            </Select>
          </Field>
          <Field label="Rentang Tanggal">
            <Input type="date" />
          </Field>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Saldo Awal" value={ledgerSummary.openingBalance} />
        <MiniStat label="Total Debit" value={ledgerSummary.totalDebit} tone="green" />
        <MiniStat label="Total Kredit" value={ledgerSummary.totalCredit} tone="amber" />
        <MiniStat label="Saldo Akhir" value={ledgerSummary.closingBalance} tone="blue" />
      </div>

      <Card>
        <CardHeader
          title={ledgerSummary.account}
          description={`Saldo normal ${ledgerSummary.normalBalance}`}
          action={<Button variant="outline">Bandingkan Akun</Button>}
        />
        <TableWrap>
          <thead>
            <tr>
              <th>No</th>
              <th>Tanggal</th>
              <th>Deskripsi</th>
              <th className="text-right">Debit</th>
              <th className="text-right">Kredit</th>
              <th className="text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            {ledgerRows.map((row, index) => (
              <tr key={`${row.date}-${row.description}`}>
                <td>{index + 1}</td>
                <td>{row.date}</td>
                <td className="font-medium text-slate-800">{row.description}</td>
                <td className="money">{formatCurrencyOrDash(row.debit)}</td>
                <td className="money">{formatCurrencyOrDash(row.credit)}</td>
                <td className="money !text-blue-700">{formatCurrency(row.balance)}</td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Card>
    </div>
  )
}
