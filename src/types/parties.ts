/**
 * Posisi keuangan satu customer.
 *
 * Catatan aturan bisnis: satu customer tidak boleh memiliki `deposit` dan
 * `receivable` terbuka secara bersamaan — deposit dipotong lebih dulu saat
 * invoice dibuat, sisanya baru menjadi piutang.
 */
export type CustomerBalance = {
  code: string
  name: string
  totalSales: number
  paid: number
  receivable: number
  deposit: number
  status: string
}

/** Posisi keuangan satu supplier. */
export type SupplierBalance = {
  code: string
  name: string
  totalPurchases: number
  paid: number
  payable: number
  openBills: string
}
