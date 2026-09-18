import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib'

export type ComboboxOption = {
  value: string
  label: string
  /** Baris kecil di bawah label, misalnya kode. Ikut dicari. */
  description?: string
}

type Props = {
  options: ComboboxOption[]
  /** Nilai terpilih; `''` berarti belum memilih. Kosongkan untuk mode tak terkendali. */
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  placeholder?: string
  /** Boleh dikosongkan kembali lewat tombol silang atau menghapus teks. Bawaan: ya. */
  clearable?: boolean
  emptyText?: string
  disabled?: boolean
  className?: string
  id?: string
  name?: string
  'aria-label'?: string
}

/** Tinggi maksimum daftar pilihan, dipakai untuk memutuskan arah bukanya. */
const LIST_MAX_HEIGHT = 288

/**
 * Select yang bisa diketik untuk mencari.
 *
 * Daftar customer, supplier, produk, dan akun akan terus bertambah; menggulir
 * dropdown native ratusan baris tidak masuk akal. Di sini pengguna cukup
 * mengetik sepotong nama atau kodenya.
 *
 * Nilai yang dipertukarkan selalu string, sama seperti `<select>` native,
 * sehingga state form yang sudah ada tidak perlu berubah.
 *
 * Daftarnya dirender lewat portal ke `body` agar tidak terpotong oleh panel
 * yang bergulir atau bertransformasi, dan berada di atas Drawer (`z-50`).
 */
export function Combobox({
  options,
  value: controlledValue,
  defaultValue = '',
  onChange,
  placeholder = 'Pilih...',
  clearable = true,
  emptyText = 'Tidak ada yang cocok',
  disabled,
  className,
  id,
  name,
  'aria-label': ariaLabel,
}: Props) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue)
  const isControlled = controlledValue !== undefined
  const value = isControlled ? controlledValue : uncontrolledValue

  const selected = options.find(option => option.value === value) ?? null

  const [isOpen, setIsOpen] = useState(false)
  /** Teks yang sedang diketik; `null` berarti belum mengetik sejak dibuka. */
  const [query, setQuery] = useState<string | null>(null)
  const [highlight, setHighlight] = useState(0)
  const [listStyle, setListStyle] = useState<CSSProperties>()

  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const justFocused = useRef(false)
  const listId = useId()

  const filtered = useMemo(() => filterOptions(options, query ?? ''), [options, query])

  function commit(next: string) {
    if (!isControlled) setUncontrolledValue(next)
    if (next !== value) onChange?.(next)
  }

  function open() {
    if (disabled) return
    setIsOpen(true)
    setQuery(null)
    setHighlight(Math.max(0, options.findIndex(option => option.value === value)))
  }

  function close() {
    setIsOpen(false)
    setQuery(null)
  }

  function choose(option: ComboboxOption) {
    commit(option.value)
    close()
  }

  // Posisi daftar mengikuti input; dihitung ulang saat halaman digulir atau
  // jendelanya berubah ukuran selama daftar terbuka.
  useLayoutEffect(() => {
    if (!isOpen) return

    function place() {
      const rect = inputRef.current?.getBoundingClientRect()
      if (!rect) return
      const spaceBelow = window.innerHeight - rect.bottom
      const opensUpward = spaceBelow < LIST_MAX_HEIGHT && rect.top > spaceBelow
      setListStyle({
        position: 'fixed',
        left: rect.left,
        width: rect.width,
        ...(opensUpward
          ? { bottom: window.innerHeight - rect.top + 4 }
          : { top: rect.bottom + 4 }),
      })
    }

    place()
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${highlight}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [isOpen, highlight])

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        if (!isOpen) open()
        else setHighlight(index => Math.min(index + 1, filtered.length - 1))
        break
      case 'ArrowUp':
        event.preventDefault()
        if (!isOpen) open()
        else setHighlight(index => Math.max(index - 1, 0))
        break
      case 'Enter':
        if (!isOpen) return
        event.preventDefault()
        if (filtered[highlight]) choose(filtered[highlight])
        break
      case 'Escape':
        if (!isOpen) return
        // Escape di sini menutup daftar saja, bukan Drawer yang menampungnya.
        event.preventDefault()
        event.stopPropagation()
        close()
        break
    }
  }

  function handleBlur() {
    // Teks dihapus seluruhnya lalu ditinggalkan: itu permintaan mengosongkan.
    if (clearable && query === '' && value) commit('')
    close()
  }

  const displayText = query ?? selected?.label ?? ''
  const showClear = clearable && Boolean(value) && !disabled

  return (
    <div className={cn('relative', className)}>
      <input
        ref={inputRef}
        id={id}
        name={name}
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-activedescendant={isOpen && filtered[highlight] ? `${listId}-${highlight}` : undefined}
        aria-autocomplete="list"
        autoComplete="off"
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          'field truncate pr-16 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500',
          !selected && !query && 'text-slate-400',
        )}
        value={displayText}
        onChange={event => {
          if (!isOpen) setIsOpen(true)
          setQuery(event.target.value)
          setHighlight(0)
        }}
        onFocus={() => {
          // Daftar tidak langsung terbuka saat fokus lewat Tab; ia terbuka saat
          // diklik, diketik, atau panah ditekan. Teksnya diseleksi agar ketikan
          // pertama langsung menggantikan label lama.
          justFocused.current = true
          inputRef.current?.select()
        }}
        onMouseUp={event => {
          // Klik yang memberi fokus tidak boleh membatalkan seleksi teksnya.
          if (justFocused.current) event.preventDefault()
          justFocused.current = false
        }}
        onClick={() => {
          if (!isOpen) open()
        }}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />

      <span className="pointer-events-none absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-0.5 text-slate-400">
        {showClear && (
          <button
            type="button"
            tabIndex={-1}
            aria-label="Kosongkan pilihan"
            className="pointer-events-auto rounded p-0.5 hover:bg-slate-100 hover:text-slate-600"
            onMouseDown={event => event.preventDefault()}
            onClick={() => {
              commit('')
              setQuery(null)
              inputRef.current?.focus()
            }}
          >
            <X size={14} />
          </button>
        )}
        <ChevronDown size={16} className={cn('transition-transform', isOpen && 'rotate-180')} />
      </span>

      {isOpen &&
        listStyle &&
        createPortal(
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            style={listStyle}
            className="z-[60] max-h-72 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 text-[13px] shadow-lg"
            // Klik di dalam daftar tidak boleh memindahkan fokus dari input.
            onMouseDown={event => event.preventDefault()}
          >
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-xs text-slate-500">{emptyText}</li>
            )}
            {filtered.map((option, index) => {
              const isSelected = option.value === value
              const isHighlighted = index === highlight

              return (
                <li
                  key={option.value}
                  id={`${listId}-${index}`}
                  data-index={index}
                  role="option"
                  aria-selected={isSelected}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-md px-3 py-2',
                    isHighlighted ? 'bg-blue-50 text-blue-900' : 'text-slate-700',
                  )}
                  onMouseEnter={() => setHighlight(index)}
                  onClick={() => choose(option)}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{option.label}</span>
                    {option.description && (
                      <span className="block truncate text-[11px] text-slate-500">
                        {option.description}
                      </span>
                    )}
                  </span>
                  {isSelected && <Check size={14} className="shrink-0 text-blue-600" />}
                </li>
              )
            })}
          </ul>,
          document.body,
        )}
    </div>
  )
}

/**
 * Menyaring pilihan: setiap kata dalam pencarian harus muncul di label atau
 * deskripsinya, urutan bebas. `nus tali` menemukan `PT Tali Nusantara`.
 */
function filterOptions(options: ComboboxOption[], query: string): ComboboxOption[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0) return options

  return options.filter(option => {
    const haystack = `${option.label} ${option.description ?? ''}`.toLowerCase()
    return words.every(word => haystack.includes(word))
  })
}
