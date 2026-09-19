import { useAuth } from './useAuth'
import { can, type Capability } from './permissions'

/** `can('transactions.write')` untuk pengguna yang sedang masuk. */
export function usePermissions() {
  const { user } = useAuth()

  return {
    role: user?.role,
    can: (capability: Capability) => can(user?.role, capability),
  }
}
