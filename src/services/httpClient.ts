import { tokenStorage } from './tokenStorage'

/**
 * Klien HTTP untuk REST API Laravel.
 *
 * Menyisipkan token Bearer secara otomatis, dan menerjemahkan kegagalan API
 * menjadi `ApiError` sehingga komponen tidak perlu menangani bentuk respons
 * Laravel secara langsung.
 */

/**
 * Alamat API.
 *
 * Secara bawaan bernilai `/api`, yaitu origin yang sama dengan halaman. Saat
 * pengembangan, dev server Vite meneruskannya ke Laravel (lihat `server.proxy`
 * pada vite.config.ts); saat produksi, web server yang menyajikan aplikasi
 * meneruskannya ke backend.
 *
 * Karena alamatnya relatif, aplikasi tetap menemukan backend baik dibuka lewat
 * localhost, IP jaringan, maupun domain tunnel — tanpa mengubah berkas `.env`.
 * Isi `VITE_API_BASE_URL` hanya bila backend memang berada di domain terpisah.
 */
const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'

/** Bentuk galat validasi Laravel: `{ message, errors: { field: [pesan] } }`. */
type ValidationErrors = Record<string, string[]>

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly errors: ValidationErrors = {},
  ) {
    super(message)
    this.name = 'ApiError'
  }

  /** Token tidak ada, kedaluwarsa, atau sudah dicabut. */
  get isUnauthenticated(): boolean {
    return this.status === 401
  }

  /** Pesan galat pertama untuk sebuah field, dipakai di bawah input form. */
  fieldError(field: string): string | undefined {
    return this.errors[field]?.[0]
  }
}

/** Dipanggil ketika API menolak token, agar sesi frontend ikut dibersihkan. */
let onUnauthenticated: (() => void) | null = null

export function setUnauthenticatedHandler(handler: (() => void) | null): void {
  onUnauthenticated = handler
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = tokenStorage.get()

  let response: Response
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    })
  } catch {
    // fetch hanya melempar saat jaringan gagal atau server tidak dapat dihubungi.
    throw new ApiError(
      'Tidak dapat terhubung ke server. Periksa koneksi atau pastikan backend berjalan.',
      0,
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  const body = await response.json().catch(() => null)

  if (!response.ok) {
    if (response.status === 401) {
      onUnauthenticated?.()
    }

    throw new ApiError(
      body?.message ?? 'Permintaan gagal diproses.',
      response.status,
      body?.errors ?? {},
    )
  }

  return body as T
}

export const http = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'POST', body: data ? JSON.stringify(data) : undefined }),
}
