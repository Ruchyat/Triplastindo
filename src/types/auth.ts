/** Peran pengguna, sama persis dengan enum `UserRole` di backend. */
export type UserRole = 'super_admin' | 'finance' | 'hr' | 'direksi' | 'viewer'

/** User yang sedang masuk, bentuknya mengikuti `UserResource` dari API. */
export type AuthUser = {
  id: number
  name: string
  email: string
  role: UserRole
  /** Label peran yang siap ditampilkan, misalnya `Super Admin`. */
  role_label: string
  is_active: boolean
  last_login_at: string | null
}

/** Balasan `POST /api/login`. */
export type LoginResponse = {
  token: string
  user: AuthUser
}

export type LoginCredentials = {
  email: string
  password: string
}
