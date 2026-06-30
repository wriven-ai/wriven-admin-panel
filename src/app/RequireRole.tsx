import { Navigate, Outlet } from 'react-router'
import { useAdminStore } from '@/stores/admin'
import type { AdminRole } from '@/lib/types'

interface RequireRoleProps {
  roles: AdminRole[]
}

export function RequireRole({ roles }: RequireRoleProps) {
  const role = useAdminStore((s) => s.me?.role)

  if (!role || !roles.includes(role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
