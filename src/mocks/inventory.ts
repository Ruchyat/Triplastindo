import type { InventoryMonth } from '@/types'

/** Kelompok produk yang dipantau pada Summary Inventory & Penjualan. */
export const inventoryTabs = ['Biji Plastik / WIP', 'Tali', 'Inventory Lain'] as const

export const inventoryMonths: InventoryMonth[] = [
  {
    month: 'Mei',
    soldKg: 6_800,
    sales: 892_500_000,
    qtyInKg: 10_450,
    qtyOutKg: 6_800,
    remainingKg: 3_650,
    inventoryValue: 21_650_000,
  },
  {
    month: 'Jun',
    soldKg: 3_650,
    sales: 404_000_000,
    qtyInKg: 14_711,
    qtyOutKg: 8_989,
    remainingKg: 5_722,
    inventoryValue: 33_936_202,
  },
  {
    month: 'Jul',
    soldKg: 7_450,
    sales: 826_200_000,
    qtyInKg: 13_800,
    qtyOutKg: 10_500,
    remainingKg: 9_022,
    inventoryValue: 53_490_430,
  },
  {
    month: 'Agu',
    soldKg: 8_100,
    sales: 910_000_000,
    qtyInKg: 14_920,
    qtyOutKg: 12_600,
    remainingKg: 11_342,
    inventoryValue: 67_235_060,
  },
  {
    month: 'Sep',
    soldKg: 8_750,
    sales: 984_500_000,
    qtyInKg: 15_600,
    qtyOutKg: 14_200,
    remainingKg: 12_742,
    inventoryValue: 75_538_060,
  },
]

export const inventorySummary = {
  monthlySales: 984_500_000,
  soldLabel: '8.750 Kg',
  remainingLabel: '12.742 Kg',
  inventoryValue: 75_538_060,
}
