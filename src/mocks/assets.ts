import type { DepreciationSummaryRow, FixedAsset } from '@/types'

export const fixedAssets: FixedAsset[] = [
  {
    code: 'MCC-01',
    name: 'Mesin Cacah 01',
    type: 'Mesin Biji',
    purchaseDate: '12 Apr 2026',
    value: 485_000_000,
    usefulLifeYears: 16,
    monthlyDepreciation: 2_500_781,
    bookValue: 472_496_095,
  },
  {
    code: 'MTL-01',
    name: 'Mesin Tali Line 01',
    type: 'Mesin Produksi Tali',
    purchaseDate: '04 Mei 2026',
    value: 650_000_000,
    usefulLifeYears: 5,
    monthlyDepreciation: 10_725_000,
    bookValue: 596_375_000,
  },
  {
    code: 'KND-01',
    name: 'Truk Mitsubishi',
    type: 'Kendaraan Ops.',
    purchaseDate: '18 Mei 2026',
    value: 385_000_000,
    usefulLifeYears: 8,
    monthlyDepreciation: 3_970_313,
    bookValue: 369_118_750,
  },
  {
    code: 'BGP-01',
    name: 'Bangunan Pabrik',
    type: 'Bangunan Pabrik',
    purchaseDate: '01 Apr 2026',
    value: 920_000_000,
    usefulLifeYears: 20,
    monthlyDepreciation: 3_795_000,
    bookValue: 897_230_000,
  },
  {
    code: 'PKT-01',
    name: 'Komputer Finance',
    type: 'Peralatan Kantor',
    purchaseDate: '10 Jun 2026',
    value: 18_500_000,
    usefulLifeYears: 4,
    monthlyDepreciation: 381_563,
    bookValue: 17_355_313,
  },
]

export const assetSummary = {
  totalValue: 2_458_500_000,
  accumulatedDepreciation: 106_824_842,
  bookValue: 2_351_675_158,
}

export const depreciationSummary: DepreciationSummaryRow[] = [
  { assetType: 'Mesin Produksi', assetValue: 1_135_000_000, depreciationExpense: 13_225_781 },
  { assetType: 'Bangunan Pabrik', assetValue: 920_000_000, depreciationExpense: 3_795_000 },
  { assetType: 'Kendaraan Ops.', assetValue: 385_000_000, depreciationExpense: 3_970_313 },
  { assetType: 'Peralatan Kantor', assetValue: 18_500_000, depreciationExpense: 381_563 },
]

/** Jurnal depresiasi bulanan yang belum diposting untuk periode berjalan. */
export const depreciationJournal = {
  period: 'September 2026',
  amount: 21_372_657,
  posted: false,
}
