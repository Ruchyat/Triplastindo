import { SubledgerView } from '@/features/subledger/components/SubledgerView'
import { receivableAging, receivableCards, receivableSummary } from '@/mocks/subledger'

/** Kartu piutang per debitur beserta umur piutangnya. */
export function ReceivablesPage() {
  return (
    <SubledgerView
      kind="receivable"
      cards={receivableCards}
      summary={receivableSummary}
      aging={receivableAging}
    />
  )
}
