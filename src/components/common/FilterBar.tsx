import { useRef, type ReactNode } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/Button'

type Props = {
  children?: ReactNode
  /** Sembunyikan kotak pencarian bila tabel sudah punya filter sendiri. */
  search?: boolean
  /** Nilai awal kotak pencarian, misalnya dari parameter URL. */
  searchValue?: string
  /**
   * Dipanggil setelah pengguna berhenti mengetik.
   *
   * Tanpa ini kotak pencarian hanya tampilan — halaman yang datanya masih mock
   * belum punya tempat untuk menyalurkan kata kuncinya.
   */
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
}

/** Jeda sebelum kata kunci dikirim, agar tiap ketikan tidak memicu permintaan. */
const TYPING_DELAY = 300

/** Baris filter di atas tabel: pencarian, dropdown periode, dan tombol filter lanjutan. */
export function FilterBar({
  children,
  search = true,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Cari data...',
}: Props) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleChange(value: string) {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => onSearchChange?.(value), TYPING_DELAY)
  }

  return (
    <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center">
      {search && (
        <div className="relative min-w-0 flex-1 lg:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            aria-label="Cari data"
            placeholder={searchPlaceholder}
            className="field pl-9"
            // Tidak terkendali: satu-satunya penulisan dari luar adalah nilai
            // awal, sehingga defaultValue cukup dan kotaknya tidak perlu
            // disinkronkan ulang setiap kali komponen dirender.
            defaultValue={searchValue}
            onChange={event => handleChange(event.target.value)}
          />
        </div>
      )}
      <div className="flex flex-1 flex-wrap gap-2">{children}</div>
      <Button variant="outline">
        <SlidersHorizontal size={15} />
        Filter
      </Button>
    </div>
  )
}
