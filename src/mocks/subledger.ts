import type { SubledgerCard } from '@/types'

/** Kartu utang, dibentuk otomatis dari tagihan pembelian kredit. */
export const payableCards: SubledgerCard[] = [
  {
    number: 'HU-014',
    party: 'PT Sumber Plastik',
    date: '02 Sep 2026',
    dueDate: '25 Sep 2026',
    amount: 180_000_000,
    paid: 45_000_000,
    status: 'Jatuh Tempo',
  },
  {
    number: 'HU-013',
    party: 'CV Karung Makmur',
    date: '28 Agu 2026',
    dueDate: '28 Sep 2026',
    amount: 125_000_000,
    paid: 75_000_000,
    status: 'Sebagian',
  },
  {
    number: 'HU-012',
    party: 'BCA Finance',
    date: '14 Agu 2026',
    dueDate: '14 Okt 2026',
    amount: 350_000_000,
    paid: 245_000_000,
    status: 'Sebagian',
  },
  {
    number: 'HU-011',
    party: 'PT Mesin Jaya',
    date: '06 Agu 2026',
    dueDate: '06 Sep 2026',
    amount: 165_000_000,
    paid: 165_000_000,
    status: 'Lunas',
  },
]

/** Kartu piutang, dibentuk otomatis dari invoice penjualan kredit. */
export const receivableCards: SubledgerCard[] = [
  {
    number: 'PU-018',
    party: 'PT Karya Mandiri',
    date: '04 Sep 2026',
    dueDate: '04 Okt 2026',
    amount: 175_000_000,
    paid: 75_000_000,
    status: 'Sebagian',
  },
  {
    number: 'PU-017',
    party: 'CV Berkah Plastik',
    date: '29 Agu 2026',
    dueDate: '29 Sep 2026',
    amount: 138_000_000,
    paid: 0,
    status: 'Belum Bayar',
  },
  {
    number: 'PU-016',
    party: 'PT Tali Nusantara',
    date: '17 Agu 2026',
    dueDate: '17 Sep 2026',
    amount: 212_000_000,
    paid: 212_000_000,
    status: 'Lunas',
  },
  {
    number: 'PU-015',
    party: 'UD Makmur',
    date: '02 Agu 2026',
    dueDate: '02 Sep 2026',
    amount: 120_000_000,
    paid: 87_550_000,
    status: 'Jatuh Tempo',
  },
]

export const payableSummary = {
  total: 820_000_000,
  settled: 565_800_000,
  outstanding: 254_200_000,
  ratioLabel: '69,0%',
}

export const receivableSummary = {
  total: 645_000_000,
  settled: 509_550_000,
  outstanding: 135_450_000,
  ratioLabel: '79,0%',
}

/** Umur piutang berdasarkan lama tunggakan sejak jatuh tempo. */
export const receivableAging = [
  { label: '0–30 hari', amount: 88_000_000 },
  { label: '31–60 hari', amount: 32_450_000 },
  { label: '61–90 hari', amount: 15_000_000 },
  { label: '>90 hari', amount: 0 },
]
