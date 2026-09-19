import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { routePaths } from '@/app/router'
import { Card, CardHeader, Combobox, Field, InfoNote, Input, NumberInput, TableWrap } from '@/components/common'
import { JournalEntryCard } from '@/components/financial'
import { Button } from '@/components/ui/Button'
import { usePermissions } from '@/features/auth/usePermissions'
import { useAsync } from '@/hooks/useAsync'
import { formatCurrency, formatDate, toAmount } from '@/lib'
import { ApiError } from '@/services/httpClient'
import { masterDataService } from '@/services/masterDataService'
import { setupService } from '@/services/setupService'

type Row = { key: number; accountCode: string; amount: string }

const balanceGroups = ['aset_lancar', 'aset_tidak_lancar', 'kontra_aset', 'liabilitas', 'ekuitas']

/**
 * Input saldo awal neraca per tanggal mulai memakai aplikasi.
 *
 * Tiap akun diisi searah saldo normalnya; selisihnya ditampung akun Saldo
 * Penyesuaian Awal Ekuitas agar jurnalnya seimbang. Hanya akun neraca —
 * akun laba rugi memulai tahun dari nol. Saldo awal stok diinput di
 * Inventory, aset di Aset & Depresiasi.
 */
export function OpeningBalancePanel() {
  const permissions = usePermissions()
  const loadEntries = useCallback(() => setupService.openingBalances(), [])
  const entries = useAsync(loadEntries)
  const loadAccounts = useCallback(() => masterDataService.accounts({ groups: balanceGroups }), [])
  const accountsData = useAsync(loadAccounts).data
  const accounts = useMemo(() => accountsData ?? [], [accountsData])

  const [date, setDate] = useState(() => `${new Date().getFullYear()}-01-01`)
  const [rows, setRows] = useState<Row[]>([{ key: 0, accountCode: '', amount: '' }])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totals = useMemo(() => {
    let debit = 0
    let credit = 0
    for (const row of rows) {
      const account = accounts.find(a => a.code === row.accountCode)
      if (!account) continue
      const amount = toAmount(row.amount)
      if (account.normal_balance === 'debit') debit += amount
      else credit += amount
    }
    return { debit, credit, difference: debit - credit }
  }, [rows, accounts])

  const filled = rows.filter(r => r.accountCode && toAmount(r.amount) !== 0)

  async function save() {
    setIsSaving(true)
    setError(null)
    try {
      await setupService.createOpeningBalance({
        date,
        rows: filled.map(r => ({ account_code: r.accountCode, amount: r.amount })),
      })
      setRows([{ key: Date.now(), accountCode: '', amount: '' }])
      entries.reload()
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : 'Saldo awal gagal disimpan.')
    } finally {
      setIsSaving(false)
    }
  }

  const update = (key: number, patch: Partial<Row>) =>
    setRows(rows.map(r => (r.key === key ? { ...r, ...patch } : r)))

  return (
    <div className="space-y-5">
      {permissions.can('transactions.write') && (
        <Card>
          <CardHeader
            title="Input Saldo Awal"
            description="Saldo neraca per tanggal mulai; selisih debit–kredit otomatis ke Saldo Penyesuaian Awal Ekuitas"
            action={
              <Button disabled={filled.length === 0 || isSaving} onClick={() => void save()}>
                {isSaving ? 'Menyimpan...' : 'Simpan Saldo Awal'}
              </Button>
            }
          />
          <div className="space-y-4 p-5">
            {error && <InfoNote tone="red">{error}</InfoNote>}
            <InfoNote>
              Saldo awal <b>stok</b> diinput di Inventory (Kg dan harga), <b>aset tetap</b> di Aset & Depresiasi
              (pilih pendanaan "saldo awal"); nilainya tetap harus masuk di sini pada akun persediaan dan aset
              tetapnya agar neraca lengkap.
            </InfoNote>
            <Field label="Per Tanggal" required className="sm:w-56">
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </Field>

            <TableWrap>
              <thead>
                <tr>
                  <th>Akun</th>
                  <th>Saldo Normal</th>
                  <th className="text-right">Saldo</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map(row => {
                  const account = accounts.find(a => a.code === row.accountCode)
                  return (
                    <tr key={row.key}>
                      <td>
                        <Combobox
                          className="w-80"
                          placeholder="Pilih akun neraca..."
                          options={accounts.map(a => ({ value: a.code, label: a.label, description: a.category?.name }))}
                          value={row.accountCode}
                          onChange={accountCode => update(row.key, { accountCode })}
                        />
                      </td>
                      <td>{account?.normal_balance_label ?? '–'}</td>
                      <td>
                        <NumberInput className="min-w-44" prefix="Rp" value={row.amount} onChange={amount => update(row.key, { amount })} />
                      </td>
                      <td>
                        <button
                          type="button"
                          aria-label="Hapus baris"
                          className="text-slate-400 hover:text-rose-600 disabled:opacity-30"
                          disabled={rows.length === 1}
                          onClick={() => setRows(rows.filter(r => r.key !== row.key))}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
                <tr className="bg-slate-50 font-bold">
                  <td>Total</td>
                  <td>Debit {formatCurrency(totals.debit)} · Kredit {formatCurrency(totals.credit)}</td>
                  <td className="money">
                    {totals.difference === 0 ? 'Seimbang' : `Penyeimbang ${formatCurrency(Math.abs(totals.difference))}`}
                  </td>
                  <td />
                </tr>
              </tbody>
            </TableWrap>

            <Button variant="outline" onClick={() => setRows([...rows, { key: Date.now(), accountCode: '', amount: '' }])}>
              + Tambah Baris
            </Button>
          </div>
        </Card>
      )}

      <Card>
        <CardHeader title="Jurnal Saldo Awal" description="Bila salah, hapus lewat Jurnal Umum lalu input ulang" />
        <div className="space-y-4 p-5">
          {entries.error && <InfoNote tone="red">{entries.error}</InfoNote>}
          {(entries.data ?? []).length === 0 && !entries.isLoading && (
            <p className="text-xs text-slate-500">
              Belum ada saldo awal. Sebelum ada, Neraca hanya berisi transaksi yang diinput di aplikasi.
            </p>
          )}
          {(entries.data ?? []).map(entry => (
            <div key={entry.id}>
              <p className="mb-2 text-xs font-semibold text-slate-700">
                {formatDate(entry.date)} · {entry.description} ·{' '}
                <Link to={`${routePaths.journals}?search=${encodeURIComponent(entry.number)}&month=${entry.date.slice(0, 7)}`} className="text-blue-700">
                  buka di Jurnal Umum
                </Link>
              </p>
              <JournalEntryCard entry={entry} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
