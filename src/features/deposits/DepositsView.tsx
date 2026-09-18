import { useNavigate } from 'react-router-dom'
import { toPath } from '@/app/router'
import { InfoNote } from '@/components/common'
import { DepositBalanceTable } from './components'
import { useDepositBalances } from './useDepositBalances'

type Props = {
  showNote?: boolean
}

/**
 * Posisi deposit per customer.
 *
 * Dipakai dua tempat: tab Deposit pada halaman Penjualan, dan halaman Deposit
 * Pelanggan yang berdiri sendiri. Kartu satu customer dan form mutasinya
 * masing-masing halaman tersendiri, bukan panel.
 */
export function DepositsView({ showNote = true }: Props) {
  const balances = useDepositBalances()
  const navigate = useNavigate()

  return (
    <>
      {balances.error && <InfoNote tone="red">{balances.error}</InfoNote>}

      <DepositBalanceTable
        balances={balances.balances}
        summary={balances.summary}
        filters={balances.filters}
        onFilterChange={balances.setFilters}
        isLoading={balances.isLoading}
        onSelect={customerId => navigate(toPath.depositCard(customerId))}
        selectedId={null}
        showNote={showNote}
      />
    </>
  )
}
