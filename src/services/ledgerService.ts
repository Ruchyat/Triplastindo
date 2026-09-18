import type { ApiAccountLedger, ApiTrialBalanceRow } from '@/types'
import { http, query } from './httpClient'

/** Rentang tanggal Buku Besar; keduanya wajib agar saldo awal punya arti. */
export type LedgerRange = { from: string; to: string }

export const ledgerService = {
  /** Neraca saldo seluruh akun yang bergerak. */
  async trialBalance(range: LedgerRange): Promise<ApiTrialBalanceRow[]> {
    const { data } = await http.get<{ data: ApiTrialBalanceRow[] }>(`/ledger${query(range)}`)
    return data
  },

  /** Mutasi dan saldo berjalan satu akun. */
  async account(accountId: number, range: LedgerRange): Promise<ApiAccountLedger> {
    const { data } = await http.get<{ data: ApiAccountLedger }>(
      `/ledger/${accountId}${query(range)}`,
    )
    return data
  },
}
