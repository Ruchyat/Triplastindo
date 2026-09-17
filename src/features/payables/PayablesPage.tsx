import { SubledgerView } from '@/features/subledger/components/SubledgerView'
import { payableCards, payableSummary } from '@/mocks/subledger'

/** Kartu utang per kreditur, dibentuk dari tagihan pembelian kredit. */
export function PayablesPage() {
  return <SubledgerView kind="payable" cards={payableCards} summary={payableSummary} />
}
