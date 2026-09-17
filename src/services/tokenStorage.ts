const TOKEN_KEY = 'triplastindo.token'

/**
 * Penyimpanan token akses.
 *
 * Token disimpan di localStorage agar sesi bertahan saat halaman dimuat ulang.
 * Dibungkus dalam modul tersendiri supaya penggantian mekanisme penyimpanan
 * kelak cukup dilakukan di satu tempat.
 */
export const tokenStorage = {
  get(): string | null {
    return localStorage.getItem(TOKEN_KEY)
  },

  set(token: string): void {
    localStorage.setItem(TOKEN_KEY, token)
  },

  clear(): void {
    localStorage.removeItem(TOKEN_KEY)
  },
}
