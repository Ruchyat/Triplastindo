import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDownLeft, ArrowUpRight, Landmark } from 'lucide-react'
import { routePaths, toPath } from '@/app/router'
import { InfoNote, MiniStat, PageHeader } from '@/components/common'
import { TabSwitch, type TabOption } from '@/components/ui/TabSwitch'
import { useAsync } from '@/hooks/useAsync'
import { toAmount } from '@/lib'
import { cashBankService } from '@/services/cashBankService'
import { ActionCard } from './components/ActionCard'
import { CashMutationsTable } from './components/CashMutationsTable'
import { CashTransfersTable } from './components/CashTransfersTable'

type CashTab = 'mutations' | 'transfers'

const tabs: TabOption<CashTab>[] = [
  { value: 'mutations', label: 'Mutasi Kas & Bank' },
  { value: 'transfers', label: 'Transfer Antar Akun' },
]

/**
 * Halaman Kas & Bank.
 *
 * Saldo dan mutasinya dihitung dari jurnal: setiap penerimaan, pembayaran,
 * pengeluaran, dan transfer yang menyentuh akun kas muncul di sini tanpa
 * dicatat ulang. Yang dicatat di halaman ini sendiri hanya transfer antar
 * akun; penerimaan dan pembayaran tetap ditautkan ke dokumen asalnya.
 */
export function CashBankPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<CashTab>('mutations')

  const loadBalances = useCallback(() => cashBankService.balances(), [])
  const balances = useAsync(loadBalances)
  const accounts = balances.data?.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Transaksi / Kas & Bank"
        title="Kas & Bank"
        description="Saldo rekening, mutasi dari seluruh modul, dan transfer antar akun"
      />

      <div className="grid gap-3 md:grid-cols-3">
        <ActionCard
          icon={<ArrowDownLeft size={20} />}
          title="Terima Pembayaran"
          description="Catat pelunasan invoice dan kurangi piutang"
          tone="green"
          onClick={() => navigate(toPath.receiptNew())}
        />
        <ActionCard
          icon={<ArrowUpRight size={20} />}
          title="Bayar Supplier"
          description="Bayar tagihan supplier dan kurangi utang"
          tone="amber"
          onClick={() => navigate(toPath.supplierPaymentNew())}
        />
        <ActionCard
          icon={<Landmark size={20} />}
          title="Transfer Antar Akun"
          description="Pindahkan dana bank atau isi petty cash"
          onClick={() => navigate(toPath.cashTransferNew())}
        />
      </div>

      {balances.error && <InfoNote tone="red">{balances.error}</InfoNote>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {accounts.map(account => (
          <MiniStat
            key={account.id}
            label={account.name}
            value={toAmount(account.balance)}
            hint={account.code}
          />
        ))}
        <MiniStat
          label="Total Kas & Bank"
          value={toAmount(balances.data?.meta.total_balance)}
          tone="green"
          hint={balances.data ? `per ${balances.data.meta.as_of}` : undefined}
        />
      </div>

      <TabSwitch options={tabs} value={tab} onChange={setTab} />

      {tab === 'mutations' && (
        <CashMutationsTable
          accounts={accounts}
          onOpenLedger={accountId => navigate(`${routePaths.generalLedger}?account=${accountId}`)}
        />
      )}
      {tab === 'transfers' && (
        <CashTransfersTable accounts={accounts} onSelect={id => navigate(toPath.cashTransfer(id))} />
      )}
    </div>
  )
}
