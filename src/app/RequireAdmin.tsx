import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { api, setCsrfToken } from '@/lib/api'
import { useAdminStore } from '@/stores/admin'
import type { AdminMeResponse } from '@/lib/types'

function useMe() {
  return useQuery({
    queryKey: ['admin', 'me'],
    queryFn: () => api.get<AdminMeResponse>('/admin/auth/me'),
    retry: false,
    staleTime: 5 * 60 * 1000,
  })
}

export function RequireAdmin() {
  const { me, setMe } = useAdminStore()
  const navigate = useNavigate()
  const { data, isLoading, isError } = useMe()

  useEffect(() => {
    if (data) {
      setCsrfToken(data.csrfToken)
      setMe(data)
    }
  }, [data, setMe])

  useEffect(() => {
    if (isError) {
      navigate('/login', { replace: true })
    }
  }, [isError, navigate])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <span className="text-sm text-muted-foreground">Loading…</span>
      </div>
    )
  }

  if (!me) return null

  return <Outlet />
}
