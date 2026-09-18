import { useLayoutEffect, useRef, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> & {
  /** Nilai mentah: `'1500000'` atau `'2.5'`, sama seperti yang dikirim ke API. */
  value: string | number | null | undefined
  /** Menerima nilai mentah yang sudah dinormalkan; `''` bila dikosongkan. */
  onChange: (raw: string) => void
  /** Banyaknya angka di belakang koma yang boleh diketik. Bawaan: bilangan bulat. */
  decimals?: number
  /** Teks di sisi kiri, misalnya `Rp`. */
  prefix?: ReactNode
  /** Teks di sisi kanan, misalnya `Kg` atau `hari`. */
  suffix?: ReactNode
}

/**
 * Input angka yang memformat dirinya sendiri saat diketik.
 *
 * Ditampilkan dengan pemisah ribuan gaya Indonesia — `1.500.000` — supaya
 * nominal besar terbaca jelas dan kelebihan atau kekurangan nol langsung
 * terlihat. Nilai yang disimpan tetap string mentah dengan titik desimal
 * (`'1500000'`, `'2.5'`), persis bentuk yang dipakai form dan API.
 *
 * Koma adalah pemisah desimal; titik yang baru diketik (dari numpad, misalnya)
 * juga diterima sebagai desimal. Titik yang sudah ada pada tampilan hanyalah
 * pemisah ribuan.
 */
export function NumberInput({
  value,
  onChange,
  decimals = 0,
  prefix,
  suffix,
  className,
  ...props
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const pendingCaret = useRef<number | null>(null)

  // Nilai mentah terakhir yang tampilannya sedang dipegang. Tampilan hanya
  // disusun ulang bila nilai dari luar benar-benar berubah, agar ketikan yang
  // belum lengkap seperti `2,` atau `2,50` tidak tertimpa.
  const incoming = normalizeRaw(value, decimals)
  const [lastRaw, setLastRaw] = useState(incoming)
  const [text, setText] = useState(() => formatDisplay(incoming))
  if (incoming !== lastRaw) {
    setLastRaw(incoming)
    setText(formatDisplay(incoming))
  }

  useLayoutEffect(() => {
    if (pendingCaret.current === null || !inputRef.current) return
    inputRef.current.setSelectionRange(pendingCaret.current, pendingCaret.current)
    pendingCaret.current = null
  }, [text])

  /** Memformat teks ketikan, menjaga posisi kursor, lalu melaporkan nilainya. */
  function applyText(typed: string, caret: number) {
    const significantBefore = countSignificant(typed.slice(0, caret))
    const { display, raw } = sanitize(typed, decimals)

    const caretAfter = caretAfterSignificant(display, significantBefore)
    if (display === text) {
      // Ketikan yang seluruhnya dibuang (huruf, misalnya) tidak mengubah state,
      // jadi kursor dikembalikan sendiri setelah React memulihkan nilai input.
      requestAnimationFrame(() => inputRef.current?.setSelectionRange(caretAfter, caretAfter))
    } else {
      pendingCaret.current = caretAfter
      setText(display)
    }

    if (raw !== lastRaw) {
      setLastRaw(raw)
      onChange(raw)
    }
  }

  return (
    <div className="relative">
      {prefix && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
          {prefix}
        </span>
      )}
      <input
        ref={inputRef}
        type="text"
        inputMode={decimals > 0 ? 'decimal' : 'numeric'}
        autoComplete="off"
        className={cn(
          'field text-right tabular-nums',
          prefix && 'pl-9',
          suffix && 'pr-10',
          className,
        )}
        value={text}
        onChange={event => {
          let typed = event.target.value
          const caret = event.target.selectionStart ?? typed.length

          // Titik yang baru saja diketik (numpad, misalnya) dimaksudkan sebagai
          // desimal — titik yang sudah ada sebelumnya adalah pemisah ribuan.
          if (decimals > 0 && typed[caret - 1] === '.' && countDots(typed) > countDots(text)) {
            typed = typed.slice(0, caret - 1) + ',' + typed.slice(caret)
          }

          applyText(typed, caret)
        }}
        {...props}
      />
      {suffix && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
          {suffix}
        </span>
      )}
    </div>
  )
}

const countDots = (text: string) => text.split('.').length - 1

/** Karakter yang menentukan posisi kursor: angka dan koma desimal. */
const isSignificant = (char: string) => /[0-9,]/.test(char)

function countSignificant(text: string): number {
  let count = 0
  for (const char of text) if (isSignificant(char)) count++
  return count
}

function caretAfterSignificant(text: string, count: number): number {
  if (count === 0) return 0
  let seen = 0
  for (let index = 0; index < text.length; index++) {
    if (isSignificant(text[index]) && ++seen === count) return index + 1
  }
  return text.length
}

/**
 * Membersihkan ketikan menjadi tampilan terformat dan nilai mentahnya.
 *
 * Semua titik dianggap pemisah ribuan dan dibuang; koma pertama menjadi
 * pemisah desimal bila desimal diizinkan. Nilai mentahnya kanonik — tanpa nol
 * di depan maupun nol desimal di belakang — sehingga sama persis dengan hasil
 * `normalizeRaw` ketika nilai itu kembali dari induk.
 */
function sanitize(typed: string, decimals: number): { display: string; raw: string } {
  const cleaned = typed.replace(/[^0-9,]/g, '')
  const commaAt = decimals > 0 ? cleaned.indexOf(',') : -1

  let integer = (commaAt === -1 ? cleaned : cleaned.slice(0, commaAt)).replace(/,/g, '')
  const fraction =
    commaAt === -1 ? null : cleaned.slice(commaAt + 1).replace(/,/g, '').slice(0, decimals)

  integer = integer.replace(/^0+(?=\d)/, '')
  if (integer === '' && fraction !== null) integer = '0'

  if (integer === '') return { display: '', raw: '' }

  const display = groupThousands(integer) + (fraction !== null ? `,${fraction}` : '')
  const significantFraction = fraction?.replace(/0+$/, '')
  const raw = significantFraction ? `${integer}.${significantFraction}` : integer

  return { display, raw }
}

/** Bentuk kanonik nilai dari luar: `'1500000'`, `'2.5'`, atau `''`. */
function normalizeRaw(value: string | number | null | undefined, decimals: number): string {
  if (value === null || value === undefined || value === '') return ''
  const number = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(number)) return ''

  const fixed = Math.abs(number).toFixed(decimals)
  const [integer, fraction = ''] = fixed.split('.')
  const trimmed = fraction.replace(/0+$/, '')
  return trimmed ? `${integer}.${trimmed}` : integer
}

/** `'1500000.5'` menjadi `'1.500.000,5'`. */
function formatDisplay(raw: string): string {
  if (raw === '') return ''
  const [integer, fraction] = raw.split('.')
  return groupThousands(integer) + (fraction ? `,${fraction}` : '')
}

const groupThousands = (digits: string) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
