import { useEffect } from 'react'
import { Outlet } from 'react-router'
import { useAdminStore } from '@/stores/admin'

export function AuthLayout() {
  const theme = useAdminStore((s) => s.theme)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Outlet />
    </div>
  )
}
