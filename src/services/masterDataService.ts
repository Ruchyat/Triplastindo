import type {
  ApiAccount,
  ApiCustomer,
  ApiProduct,
  ApiProductCategory,
  ApiPurchaseCategory,
  ApiSupplier,
  Collection,
  ProductPayload,
  Resource,
} from '@/types'
import { http, query } from './httpClient'

/**
 * Master data yang mengisi dropdown form transaksi.
 *
 * Ketiganya jarang berubah dan tidak dipaginasi backend, sehingga aman diambil
 * sekaligus lalu disimpan selama halaman terbuka.
 */
export const masterDataService = {
  /**
   * Daftar akun COA.
   *
   * `isCash` menyaring akun Kas & Bank saja; `groups` menyaring kelompok
   * tertentu, misalnya `['beban', 'hpp']` untuk form pengeluaran.
   */
  async accounts(options: { isCash?: boolean; groups?: string[] } = {}): Promise<ApiAccount[]> {
    const { data } = await http.get<Collection<ApiAccount>>(
      `/accounts${query({ is_active: true, is_cash: options.isCash, group: options.groups?.join(',') })}`,
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

  async productCategories(): Promise<ApiProductCategory[]> {
    const { data } = await http.get<Collection<ApiProductCategory>>('/product-categories')
    return data
  },

  /**
   * Menambah produk tanpa meninggalkan form transaksi.
   *
   * Barang yang dibeli sering belum ada di master; memaksa pencatat pindah ke
   * halaman Setup lalu kembali hanya membuat isian tagihannya hilang.
   */
  async createProduct(payload: ProductPayload): Promise<ApiProduct> {
    const { data } = await http.post<Resource<ApiProduct>>('/products', payload)
    return data
  },
}
