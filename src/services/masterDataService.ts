import type {
  AccountPayload,
  ApiAccount,
  ApiAccountCategory,
  ApiCustomer,
  ApiProduct,
  ApiProductCategory,
  ApiPurchaseCategory,
  ApiSupplier,
  Collection,
  CustomerPayload,
  ProductPayload,
  Resource,
  SupplierPayload,
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
  async accounts(
    options: { isCash?: boolean; groups?: string[]; includeInactive?: boolean } = {},
  ): Promise<ApiAccount[]> {
    const { data } = await http.get<Collection<ApiAccount>>(
      `/accounts${query({
        is_active: options.includeInactive ? undefined : true,
        is_cash: options.isCash,
        group: options.groups?.join(','),
      })}`,
    )
    return data
  },

  async accountCategories(): Promise<ApiAccountCategory[]> {
    const { data } = await http.get<Collection<ApiAccountCategory>>('/account-categories')
    return data
  },

  async createAccount(payload: AccountPayload): Promise<ApiAccount> {
    const { data } = await http.post<Resource<ApiAccount>>('/accounts', payload)
    return data
  },

  async updateAccount(id: number, payload: AccountPayload): Promise<ApiAccount> {
    const { data } = await http.put<Resource<ApiAccount>>(`/accounts/${id}`, payload)
    return data
  },

  /**
   * Daftar customer.
   *
   * `withBalance` ikut membawa sisa piutang dan saldo depositnya — dipakai
   * form penjualan untuk memberitahu berapa deposit yang akan dipotong.
   */
  async customers(
    options: { withBalance?: boolean; includeInactive?: boolean; activityYear?: number } = {},
  ): Promise<ApiCustomer[]> {
    const { data } = await http.get<Collection<ApiCustomer>>(
      `/customers${query({
        is_active: options.includeInactive ? undefined : true,
        with_balance: options.withBalance,
        with_activity: options.activityYear !== undefined ? true : undefined,
        year: options.activityYear,
      })}`,
    )
    return data
  },

  async createCustomer(payload: CustomerPayload): Promise<ApiCustomer> {
    const { data } = await http.post<Resource<ApiCustomer>>('/customers', payload)
    return data
  },

  async updateCustomer(id: number, payload: CustomerPayload): Promise<ApiCustomer> {
    const { data } = await http.put<Resource<ApiCustomer>>(`/customers/${id}`, payload)
    return data
  },

  async suppliers(
    options: { withBalance?: boolean; includeInactive?: boolean; activityYear?: number } = {},
  ): Promise<ApiSupplier[]> {
    const { data } = await http.get<Collection<ApiSupplier>>(
      `/suppliers${query({
        is_active: options.includeInactive ? undefined : true,
        with_balance: options.withBalance,
        with_activity: options.activityYear !== undefined ? true : undefined,
        year: options.activityYear,
      })}`,
    )
    return data
  },

  async createSupplier(payload: SupplierPayload): Promise<ApiSupplier> {
    const { data } = await http.post<Resource<ApiSupplier>>('/suppliers', payload)
    return data
  },

  async updateSupplier(id: number, payload: SupplierPayload): Promise<ApiSupplier> {
    const { data } = await http.put<Resource<ApiSupplier>>(`/suppliers/${id}`, payload)
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

  async products(options: { includeInactive?: boolean } = {}): Promise<ApiProduct[]> {
    const { data } = await http.get<Collection<ApiProduct>>(
      `/products${query({ is_active: options.includeInactive ? undefined : true })}`,
    )
    return data
  },

  async updateProduct(id: number, payload: ProductPayload): Promise<ApiProduct> {
    const { data } = await http.put<Resource<ApiProduct>>(`/products/${id}`, payload)
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
