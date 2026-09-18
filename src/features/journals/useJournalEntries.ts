import { useCallback, useState } from 'react'
import { useAsync } from '@/hooks/useAsync'
import { journalService, type JournalFilters } from '@/services/journalService'

/** Bulan berjalan sebagai `YYYY-MM`, filter bawaan halaman. */
const currentMonth = () => new Date().toISOString().slice(0, 7)

/** Rentang tanggal awal dan akhir sebuah bulan. */
function monthRange(month: string): { from: string; to: string } {
  const [year, index] = month.split('-').map(Number)
  const last = new Date(year, index, 0).getDate()
  return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, '0')}` }
}

/**
 * Daftar Jurnal Umum beserta ringkasannya.
 *
 * Ringkasan diambil terpisah dari backend agar mencakup seluruh jurnal pada
 * filter yang dipakai, bukan hanya halaman yang sedang tampil.
 *
 * `initial` dipakai ketika halaman dibuka dari tautan nomor jurnal di detail
 * invoice. Bulannya ikut dibawa karena filter bawaan halaman adalah bulan
 * berjalan, dan jurnal yang dituju bisa saja berada di bulan lain.
 */
export function useJournalEntries(initial: { month?: string; search?: string } = {}) {
  const [month, setMonth] = useState(initial.month || currentMonth())
  const [filters, setFilters] = useState<JournalFilters>({ search: initial.search })
  const [page, setPage] = useState(1)

  const scope: JournalFilters = { ...filters, ...monthRange(month), page }

  const load = useCallback(
    () => Promise.all([journalService.list(scope), journalService.summary(scope)]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [month, page, filters],
  )

  const { data, isLoading, error, reload } = useAsync(load)

  /** Mengubah filter selalu kembali ke halaman pertama. */
  function changeFilters(next: JournalFilters) {
    setFilters(next)
    setPage(1)
  }

  function changeMonth(next: string) {
    setMonth(next)
    setPage(1)
  }

  return {
    entries: data?.[0].data ?? [],
    meta: data?.[0].meta,
    summary: data?.[1],
    isLoading,
    error,
    reload,
    month,
    changeMonth,
    filters,
    changeFilters,
    page,
    setPage,
  }
}
