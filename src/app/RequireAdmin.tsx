import { useEffect } from 'react'
import { Outlet } from 'react-router'
import { setCsrfToken } from '@/lib/api'
import { useAdminStore } from '@/stores/admin'

// Mock auth — replace with real GET /admin/auth/me query when login is built
// AdminView shape: id (not adminUserId), active, no mfaEnabled
const MOCK_ADMIN = {
  id: 'mock-admin-01',
  email: 'admin@wriven.com',
  name: 'Admin User',
  role: 'admin' as const,
  active: true,
  lastLoginAt: null,
  createdAt: new Date().toISOString(),
}

export function RequireAdmin() {
  const { me, setMe } = useAdminStore()

  useEffect(() => {
    if (!me) {
      setCsrfToken(null) // will be set from real /admin/auth/me response
      setMe(MOCK_ADMIN)
    }
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
