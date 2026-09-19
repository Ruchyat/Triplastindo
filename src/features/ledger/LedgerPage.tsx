import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, Combobox, Field, InfoNote, Input, PageHeader } from '@/components/common'
import { TabSwitch, type TabOption } from '@/components/ui/TabSwitch'
import { useAsync } from '@/hooks/useAsync'
import { monthEnd, monthStart } from '@/lib'
import { masterDataService } from '@/services/masterDataService'
import { AccountLedgerView } from './components/AccountLedgerView'
import { TrialBalanceView } from './components/TrialBalanceView'

type LedgerTab = 'ledger' | 'trial-balance'

const tabs: TabOption<LedgerTab>[] = [
  { value: 'ledger', label: 'Buku Besar' },
  { value: 'trial-balance', label: 'Neraca Saldo' },
]


/**
 * Halaman Buku Besar dan Neraca Saldo.
 *
 * Keduanya dihitung backend langsung dari baris jurnal, dengan saldo awal
 * dari segala yang terjadi sebelum rentang tanggalnya. Saldo mengikuti saldo
 * normal akun: akun debit dihitung D − K, akun kredit K − D.
 *
 * `?account=` membuka Buku Besar langsung pada akun itu.
 */
export function LedgerPage() {
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState<LedgerTab>('ledger')
  const [accountId, setAccountId] = useState(searchParams.get('account') ?? '')
  const [from, setFrom] = useState(monthStart)
  const [to, setTo] = useState(monthEnd)

  const loadAccounts = useCallback(() => masterDataService.accounts(), [])
  const accounts = useAsync(loadAccounts)

  const isRangeValid = Boolean(from) && Boolean(to) && from <= to

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Laporan / Buku Besar"
        title="Buku Besar"
        description="Mutasi per akun dan neraca saldo, dihitung dari jurnal yang sama"
      />

      {accounts.error && <InfoNote tone="red">{accounts.error}</InfoNote>}

      <TabSwitch options={tabs} value={tab} onChange={setTab} />

      <Card className="p-5">
        <div className="grid gap-4 md:grid-cols-3">
          {tab === 'ledger' && (
            <Field label="Akun">
              <Combobox
                placeholder="Pilih akun..."
                options={(accounts.data ?? []).map(account => ({
                  value: String(account.id),
                  label: account.label,
                }))}
                value={accountId}
                onChange={setAccountId}
              />
            </Field>
          )}
          <Field label="Dari Tanggal">
            <Input type="date" value={from} onChange={e => setFrom(e.target.value)} />
          </Field>
          <Field label="Sampai Tanggal">
            <Input type="date" value={to} onChange={e => setTo(e.target.value)} />
          </Field>
        </div>
        {!isRangeValid && (
          <p className="mt-3 text-xs text-rose-600">Tanggal awal harus sebelum tanggal akhir.</p>
        )}
      </Card>

      {tab === 'ledger' &&
        (accountId && isRangeValid ? (
          <AccountLedgerView accountId={Number(accountId)} from={from} to={to} />
        ) : (
          <p className="text-xs text-slate-500">Pilih akun untuk melihat mutasinya.</p>
        ))}

      {tab === 'trial-balance' && isRangeValid && (
        <TrialBalanceView
          from={from}
          to={to}
          onOpenAccount={id => {
            setAccountId(String(id))
            setTab('ledger')
          }}
        />
      )}
    </div>
  )
}
