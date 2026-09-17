import type { PurchaseBill } from '@/types'

export const purchaseBills: PurchaseBill[] = [
  {
    number: 'PUR/2026/09/024',
    date: '16 Sep 2026',
    supplier: 'PT Sumber Plastik',
    category: 'Bahan Baku',
    item: 'Karung Polos',
    total: 142_500_000,
    paid: 45_000_000,
    status: 'Sebagian',
  },
  {
    number: 'PUR/2026/09/023',
    date: '14 Sep 2026',
    supplier: 'CV Teknik Makmur',
    category: 'Sparepart',
    item: 'Bearing Mesin Cacah',
    total: 18_750_000,
    paid: 18_750_000,
    status: 'Lunas',
  },
  {
    number: 'PUR/2026/09/022',
    date: '10 Sep 2026',
    supplier: 'PT Kimia Sentosa',
    category: 'Bahan Pendukung',
    item: 'Pewarna Plastik',
    total: 32_400_000,
    paid: 0,
    status: 'Belum Bayar',
  },
  {
    number: 'PUR/2026/09/021',
    date: '02 Sep 2026',
    supplier: 'Mitra Mesin Abadi',
    category: 'Aset',
    item: 'Mesin Extruder',
    total: 285_000_000,
    paid: 0,
    status: 'Jatuh Tempo',
  },
]

export const purchaseSummary = {
  monthlyPurchases: 478_650_000,
  paid: 63_750_000,
  openPayable: 414_900_000,
  overdueBills: '1 Tagihan',
}
