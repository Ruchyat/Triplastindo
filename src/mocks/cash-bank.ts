import type { CashBankMovement } from '@/types'

/** Mutasi terbaru seluruh akun kas dan bank. Nilai negatif berarti uang keluar. */
export const cashBankMovements: CashBankMovement[] = [
  {
    date: '17 Sep 2026',
    account: 'Bank BCA',
    type: 'Penerimaan',
    counterparty: 'PT Tali Nusantara',
    reference: 'INV/2026/09/018',
    amount: 45_000_000,
  },
  {
    date: '17 Sep 2026',
    account: 'Bank BCA',
    type: 'Pengeluaran',
    counterparty: 'PLN',
    reference: 'EXP/2026/09/041',
    amount: -64_500_000,
  },
  {
    date: '16 Sep 2026',
    account: 'Bank BNI',
    type: 'Pengeluaran',
    counterparty: 'Logistik Jaya',
    reference: 'EXP/2026/09/040',
    amount: -12_750_000,
  },
  {
    date: '15 Sep 2026',
    account: 'Bank BCA',
    type: 'Transfer',
    counterparty: 'Petty Cash',
    reference: 'TRF/2026/09/009',
    amount: -10_000_000,
  },
  {
    date: '15 Sep 2026',
    account: 'Petty Cash',
    type: 'Transfer',
    counterparty: 'Bank BCA',
    reference: 'TRF/2026/09/009',
    amount: 10_000_000,
  },
]

export const cashBankBalances = {
  bcaBalance: 182_750_000,
  bniBalance: 64_150_000,
  pettyCashBalance: 7_200_000,
  totalBalance: 312_650_000,
}
