import { Plus, Trash2 } from 'lucide-react'
import {
  Card,
  CardHeader,
  Field,
  Input,
  Select,
  TableWrap,
} from '@/components/common'
import { BalanceIndicator } from '@/components/financial'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib'
import { accountOptions } from '@/mocks/accounts'

const draftRows = accountOptions.slice(1, 4)

const totals = {
  debit: 25_000_000,
  credit: 25_000_000,
}

/**
 * Jurnal majemuk untuk transaksi yang melibatkan lebih dari dua akun.
 *
 * Jurnal hanya boleh tersimpan ketika total debit sama dengan total kredit.
 */
export function CompoundJournalForm() {
  const difference = totals.debit - totals.credit

  return (
    <Card>
      <CardHeader
        title="Jurnal Majemuk"
        description="Tambahkan beberapa baris debit dan kredit"
        action={<BalanceIndicator difference={difference} />}
      />

      <div className="grid gap-4 p-5 md:grid-cols-3">
        <Field label="Tanggal">
          <Input type="date" />
        </Field>
        <Field label="Jenis Pembayaran">
          <Select className="w-full">
            <option>Transfer Antar Bank</option>
          </Select>
        </Field>
        <Field label="Keterangan">
          <Input placeholder="Keterangan jurnal" />
        </Field>
      </div>

      <TableWrap>
        <thead>
          <tr>
            <th>Akun</th>
            <th>Keterangan</th>
            <th className="text-right">Debit</th>
            <th className="text-right">Kredit</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {draftRows.map(account => (
            <tr key={account}>
              <td>
                <Select className="w-64">
                  <option>{account}</option>
                </Select>
              </td>
              <td>
                <Input placeholder="Keterangan baris" />
              </td>
              <td>
                <Input className="text-right" placeholder="Rp 0" />
              </td>
              <td>
                <Input className="text-right" placeholder="Rp 0" />
              </td>
              <td>
                <button aria-label="Hapus baris" className="text-slate-400 hover:text-rose-600">
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </TableWrap>

      <div className="flex flex-col justify-between gap-4 border-t border-slate-100 p-5 sm:flex-row sm:items-end">
        <Button variant="outline">
          <Plus size={16} />
          Tambah Baris
        </Button>

        <div className="grid grid-cols-3 gap-6 text-right text-xs">
          <TotalCell label="Total Debit" value={formatCurrency(totals.debit)} />
          <TotalCell label="Total Kredit" value={formatCurrency(totals.credit)} />
          <TotalCell
            label="Selisih"
            value={formatCurrency(difference)}
            tone={difference === 0 ? 'text-emerald-700' : 'text-rose-700'}
          />
        </div>

        <Button disabled={difference !== 0}>Simpan Jurnal</Button>
      </div>
    </Card>
  )
}

function TotalCell({
  label,
  value,
  tone = 'text-slate-900',
}: {
  label: string
  value: string
  tone?: string
}) {
  return (
    <div>
      <p className="text-slate-500">{label}</p>
      <b className={`mt-1 block ${tone}`}>{value}</b>
    </div>
  )
}
