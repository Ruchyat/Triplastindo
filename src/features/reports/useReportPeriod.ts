import { useState } from 'react'

export const monthNames = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

/**
 * Periode yang sedang dilihat pada halaman laporan.
 *
 * `ytd` memilih kolom yang ditampilkan — bulan itu saja atau akumulasi sejak
 * Januari — sama seperti dua kolom di Google Sheet.
 */
export function useReportPeriod() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [ytd, setYtd] = useState(false)

  const monthEnd = new Date(year, month, 0)
  const label = ytd
    ? `1 Januari – ${monthEnd.getDate()} ${monthNames[month - 1]} ${year}`
    : `1 – ${monthEnd.getDate()} ${monthNames[month - 1]} ${year}`

  return {
    year, setYear,
    month, setMonth,
    ytd, setYtd,
    period: { year, month },
    /** `30 September 2026` — untuk kop laporan. */
    endLabel: `${monthEnd.getDate()} ${monthNames[month - 1]} ${year}`,
    /** Rentang yang sedang ditampilkan, untuk kop laporan. */
    rangeLabel: label,
  }
}

export type ReportPeriodState = ReturnType<typeof useReportPeriod>
