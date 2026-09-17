import { useCallback, useState } from 'react'

/**
 * Mengelola state buka-tutup panel, dialog, atau drawer.
 *
 * Varian generik `useDrawer` di bawah dipakai ketika satu halaman membuka
 * beberapa jenis dokumen dari satu panel yang sama.
 */
export function useDisclosure(initial = false) {
  const [isOpen, setIsOpen] = useState(initial)
  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen(value => !value), [])
  return { isOpen, open, close, toggle }
}

/** Menyimpan jenis dokumen yang sedang dibuka pada panel transaksi. */
export function useDrawer<T>() {
  const [active, setActive] = useState<T | null>(null)
  const close = useCallback(() => setActive(null), [])
  return { active, open: setActive, close }
}
