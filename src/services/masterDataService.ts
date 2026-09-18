import type {
  ApiAccount,
  ApiCustomer,
  ApiProduct,
  ApiPurchaseCategory,
  ApiSupplier,
  Collection,
} from '@/types'
import { http, query } from './httpClient'

/**
 * Master data yang mengisi dropdown form transaksi.
 *
 * Ketiganya jarang berubah dan tidak dipaginasi backend, sehingga aman diambil
 * sekaligus lalu disimpan selama halaman terbuka.
 */
export const masterDataService = {
  /** Daftar akun COA. `isCash` menyaring akun Kas & Bank saja. */
  async accounts(options: { isCash?: boolean } = {}): Promise<ApiAccount[]> {
    const { data } = await http.get<Collection<ApiAccount>>(
      `/accounts${query({ is_active: true, is_cash: options.isCash })}`,
    )
    return data
  },

  /**
   * Daftar customer.
   *
   * `withBalance` ikut membawa sisa piutang dan saldo depositnya — dipakai
   * form penjualan untuk memberitahu berapa deposit yang akan dipotong.
   */
  async customers(options: { withBalance?: boolean } = {}): Promise<ApiCustomer[]> {
    const { data } = await http.get<Collection<ApiCustomer>>(
      `/customers${query({ is_active: true, with_balance: options.withBalance })}`,
    )
    return data
  },

  async suppliers(options: { withBalance?: boolean } = {}): Promise<ApiSupplier[]> {
    const { data } = await http.get<Collection<ApiSupplier>>(
      `/suppliers${query({ is_active: true, with_balance: options.withBalance })}`,
    )
    return data
  },

  /**
   * Kategori pembelian beserta akun yang dipakainya.
   *
   * Diambil dari backend, bukan didaftar ulang di sini: pemetaannya ada di
   * konfigurasi server dan dapat berubah tanpa menyentuh aplikasi ini.
   */
  async purchaseCategories(): Promise<ApiPurchaseCategory[]> {
    const { data } = await http.get<Collection<ApiPurchaseCategory>>('/purchase-categories')
    return data
  },

  async products(): Promise<ApiProduct[]> {
    const { data } = await http.get<Collection<ApiProduct>>(`/products${query({ is_active: true })}`)
    return data
  },
}
