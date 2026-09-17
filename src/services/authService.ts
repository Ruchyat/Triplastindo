import type { AuthUser, LoginCredentials, LoginResponse } from '@/types/auth'
import { http } from './httpClient'

/** Pembungkus resource tunggal Laravel: `{ "data": {...} }`. */
type Resource<T> = { data: T }

export const authService = {
  /** Menukar email dan kata sandi dengan token akses. */
  login(credentials: LoginCredentials) {
    return http.post<LoginResponse>('/login', { ...credentials, device_name: 'web' })
  },

  /** Mengambil data user pemilik token yang tersimpan. */
  async me(): Promise<AuthUser> {
    const { data } = await http.get<Resource<AuthUser>>('/me')
    return data
  },

  /** Mencabut token yang sedang dipakai di sisi server. */
  logout() {
    return http.post<{ message: string }>('/logout')
  },
}
