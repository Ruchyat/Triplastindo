/**
 * Tanggal dalam zona waktu lokal, berbentuk `YYYY-MM-DD`.
 *
 * `toISOString()` memakai UTC: pada pukul 05.00 WIB tanggal 1, hasilnya masih
 * tanggal terakhir bulan lalu. Form transaksi dan filter periode memakai
 * fungsi ini supaya tanggal bawaannya mengikuti kalender pengguna.
 */
export function toDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Hari ini, `YYYY-MM-DD`. */
export const today = () => toDateString(new Date())

/** Tanggal pertama bulan berjalan. */
export const monthStart = () => {
  const now = new Date()
  return toDateString(new Date(now.getFullYear(), now.getMonth(), 1))
}

/** Tanggal terakhir bulan berjalan. */
export const monthEnd = () => {
  const now = new Date()
  return toDateString(new Date(now.getFullYear(), now.getMonth() + 1, 0))
}

/** Bulan berjalan, `YYYY-MM`. */
export const currentMonth = () => today().slice(0, 7)

/** Menambah sejumlah hari ke tanggal `YYYY-MM-DD`, tanpa pergeseran zona waktu. */
export function addDays(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number)
  return toDateString(new Date(year, month - 1, day + days))
}
