import { useEffect } from 'react'
import { Outlet } from 'react-router'
import { useAdminStore } from '@/stores/admin'

// Mock auth — replace with real GET /admin/auth/me query when login is built
const MOCK_ADMIN = {
  adminUserId: 'mock-admin-01',
  email: 'admin@wriven.com',
  name: 'Admin User',
  role: 'admin',
} as const

export function RequireAdmin() {
  const { me, setMe } = useAdminStore()

  useEffect(() => {
    if (!me) setMe(MOCK_ADMIN)
  }, [me, setMe])

  if (!me) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <span className="text-sm text-muted-foreground">Loading…</span>
      </div>
    )
  }

  return <Outlet />
}
