/**
 * Format angka, mata uang, dan tanggal sesuai konvensi laporan Triplastindo.
 *
 * Aturan tampilan (UI Specification §23):
 * - Mata uang  : `Rp 1.234.567`
 * - Negatif    : `(Rp 17.460.000)` pada laporan keuangan, bukan `-Rp 17.460.000`
 * - Persentase : `26,0%`
 * - Tanggal    : `17 September 2026`
 * - Nilai kosong selalu `–`, tidak pernah `NaN`, `null`, atau `#DIV/0!`
 */

/** Penanda nilai kosong yang dipakai di seluruh tabel dan laporan. */
export const EMPTY_VALUE = '–'

/**
 * Mengubah nilai uang dari API menjadi angka untuk ditampilkan.
 *
 * Backend mengirim uang sebagai string dua desimal — `"105000000.00"` — supaya
 * ketepatannya tidak hilang dalam perjalanan. Pakai fungsi ini tepat sebelum
 * memformatnya, bukan saat data diterima, agar nilai aslinya tetap utuh ketika
 * dikirim kembali ke backend.
 */
export function toAmount(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const isPresent = (value: number | null | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

const compactCurrencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  notation: 'compact',
  maximumFractionDigits: 1,
})

const numberFormatter = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 })

const percentFormatter = new Intl.NumberFormat('id-ID', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const longDateFormatter = new Intl.DateTimeFormat('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

/** `Rp 1.234.567`. Pakai `compact` untuk KPI card: `Rp 1,2 jt`. */
export function formatCurrency(value: number | null | undefined, compact = false): string {
  if (!isPresent(value)) return EMPTY_VALUE
  const formatter = compact ? compactCurrencyFormatter : currencyFormatter
  return formatter.format(value).replace('Rp', 'Rp ')
}

/**
 * Format mata uang untuk laporan keuangan: nilai negatif ditampilkan
 * dalam kurung, `(Rp 17.460.000)`, sesuai konvensi akuntansi.
 */
export function formatAccountingCurrency(value: number | null | undefined, compact = false): string {
  if (!isPresent(value)) return EMPTY_VALUE
  if (value < 0) return `(${formatCurrency(Math.abs(value), compact)})`
  return formatCurrency(value, compact)
}

/** `Rp 1.234.567` bila ada nilainya, `–` bila nol atau kosong. */
export function formatCurrencyOrDash(value: number | null | undefined, compact = false): string {
  if (!isPresent(value) || value === 0) return EMPTY_VALUE
  return formatCurrency(value, compact)
}

/** `152.400` — angka biasa tanpa simbol mata uang. */
export function formatNumber(value: number | null | undefined): string {
  if (!isPresent(value)) return EMPTY_VALUE
  return numberFormatter.format(value)
}

/** `8.750 Kg` */
export function formatKg(value: number | null | undefined): string {
  if (!isPresent(value)) return EMPTY_VALUE
  return `${numberFormatter.format(value)} Kg`
}

/** `26,0%` dari pecahan `0.26`. */
export function formatPercent(value: number | null | undefined): string {
  if (!isPresent(value)) return EMPTY_VALUE
  return percentFormatter.format(value)
}

/**
 * `26,0%` dari rasio dua angka. Pembagian dengan nol menghasilkan `–`,
 * bukan `#DIV/0!` seperti pada spreadsheet lama.
 */
export function formatRatioPercent(
  numerator: number | null | undefined,
  denominator: number | null | undefined,
): string {
  if (!isPresent(numerator) || !isPresent(denominator) || denominator === 0) return EMPTY_VALUE
  return formatPercent(numerator / denominator)
}

/** `17 September 2026` dari `Date` atau string ISO. */
export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return EMPTY_VALUE
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return EMPTY_VALUE
  return dateFormatter.format(date)
}

/** `Kamis, 17 September 2026` untuk kop laporan. */
export function formatLongDate(value: Date | string | null | undefined): string {
  if (!value) return EMPTY_VALUE
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return EMPTY_VALUE
  return longDateFormatter.format(date)
}
