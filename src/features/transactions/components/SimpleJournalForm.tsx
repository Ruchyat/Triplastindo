import { useState } from 'react'
import { Upload } from 'lucide-react'
import {
  Card,
  CardHeader,
  Field,
  Input,
  Select,
  Textarea,
} from '@/components/common'
import { BalanceIndicator } from '@/components/financial'
import { Button } from '@/components/ui/Button'
import { cn, formatCurrency } from '@/lib'
import { accountOptions } from '@/mocks/accounts'

/**
 * Jurnal penyesuaian dua akun.
 *
 * Dipakai Finance untuk koreksi dan reklasifikasi — bukan jalur utama
 * pencatatan transaksi bisnis.
 */
export function SimpleJournalForm() {
  const [amount, setAmount] = useState(10_000_000)

  return (
    <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
      <Card>
        <CardHeader
          title="Detail Jurnal"
          description="Lengkapi informasi jurnal dan pilih dua akun"
        />
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <Field label="Tanggal" required>
            <Input type="date" />
          </Field>
          <Field label="Jenis Pembayaran" required>
            <Select className="w-full">
              <option>Transfer Sesama Bank</option>
              <option>Cash</option>
              <option>Kredit</option>
            </Select>
          </Field>

          <Field label="Akun Debit" required>
            <Select className="w-full">
              {accountOptions.map(account => (
                <option key={account}>{account}</option>
              ))}
            </Select>
          </Field>
          <Field label="Akun Kredit" required>
            <Select className="w-full">
              {[...accountOptions].reverse().map(account => (
                <option key={account}>{account}</option>
              ))}
            </Select>
          </Field>

          <Field label="Nominal" required>
            <Input
              type="number"
              value={amount}
              onChange={event => setAmount(Number(event.target.value) || 0)}
            />
          </Field>
          <Field label="Referensi">
            <Input placeholder="No. invoice / referensi" />
          </Field>

          <Field label="Keterangan" required className="md:col-span-2">
            <Textarea defaultValue="Penyesuaian jurnal September 2026" />
          </Field>

          <Field label="No. Hutang">
            <Select className="w-full">
              <option>– Tidak ditautkan –</option>
              <option>HU-001</option>
            </Select>
          </Field>
          <Field label="No. Piutang">
            <Select className="w-full">
              <option>– Tidak ditautkan –</option>
              <option>PU-004</option>
            </Select>
          </Field>

          <div className="md:col-span-2">
            <button
              className={cn(
                'flex h-24 w-full items-center justify-center gap-2 rounded-xl',
                'border border-dashed border-slate-300 bg-slate-50',
                'text-xs font-semibold text-slate-500 hover:border-blue-400 hover:text-blue-700',
              )}
            >
              <Upload size={17} />
              Unggah bukti transaksi
            </button>
          </div>
        </div>
      </Card>

      <JournalPreviewCard amount={amount} />
    </div>
  )
}

/** Preview dua baris jurnal beserta indikator keseimbangannya. */
function JournalPreviewCard({ amount }: { amount: number }) {
  const rows = [
    { account: 'Bank BCA', debit: amount, credit: 0 },
    { account: 'Penjualan Tali', debit: 0, credit: amount },
  ]

  return (
    <Card className="h-fit">
      <CardHeader
        title="Preview Jurnal"
        description="Jurnal dibuat otomatis dari data di samping"
        action={<BalanceIndicator difference={0} />}
      />
      <div className="p-5">
        <div className="rounded-xl border border-slate-200">
          <div
            className={cn(
              'grid grid-cols-[1fr_auto_auto] gap-3 bg-slate-50 px-4 py-3',
              'text-[10px] font-bold uppercase text-slate-500',
            )}
          >
            <span>Akun</span>
            <span>Debit</span>
            <span>Kredit</span>
          </div>
          {rows.map(row => (
            <div
              key={row.account}
              className="grid grid-cols-[1fr_auto_auto] gap-3 border-t border-slate-100 px-4 py-4 text-xs"
            >
              <span className="font-semibold text-slate-800">{row.account}</span>
              <span className="w-24 text-right">{row.debit ? formatCurrency(row.debit) : '–'}</span>
              <span className="w-24 text-right">
                {row.credit ? formatCurrency(row.credit) : '–'}
              </span>
            </div>
          ))}
          <div
            className={cn(
              'grid grid-cols-[1fr_auto_auto] gap-3 border-t border-slate-100 bg-emerald-50 px-4 py-3',
              'text-xs font-bold text-emerald-800',
            )}
          >
            <span>Selisih</span>
            <span />
            <span className="w-24 text-right">{formatCurrency(0)}</span>
          </div>
        </div>

        <p className="mt-4 rounded-lg bg-blue-50 p-3 text-[11px] leading-5 text-blue-800">
          Tagging otomatis: <b>Kas &amp; Bank</b>. Nomor jurnal dibuat saat jurnal disimpan.
        </p>
        <Button className="mt-5 w-full">Simpan Jurnal</Button>
      </div>
    </Card>
  )
}
