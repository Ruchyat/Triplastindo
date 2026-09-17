/**
 * Klien HTTP untuk REST API Laravel.
 *
 * Belum dipakai selama tahap UI — halaman masih membaca `src/mocks`.
 * Ketika backend siap, setiap service di folder ini memanggil `request`
 * sehingga komponen tidak perlu mengetahui detail transport.
 */

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...init?.headers,
    },
    ...init,
  })

  if (!response.ok) {
    throw new ApiError(`Permintaan ke ${path} gagal`, response.status)
  }

  return (await response.json()) as T
}
