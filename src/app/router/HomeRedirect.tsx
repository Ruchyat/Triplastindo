import { Navigate } from 'react-router-dom'
import { navigationFor } from '@/components/layout/navigation'
import { usePermissions } from '@/features/auth/usePermissions'
import { routePaths } from './paths'

/** Halaman pertama yang boleh dilihat peran ini — HR tidak punya Dashboard, misalnya. */
export function HomeRedirect() {
  const permissions = usePermissions()
  const first = navigationFor(permissions.can)[0]?.items[0]?.path ?? routePaths.dashboard

  return <Navigate to={first} replace />
}
