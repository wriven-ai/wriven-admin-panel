import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { qk } from '@/lib/query-keys'
import { queryClient } from '@/lib/query-client'
import type { Paginated, TenantUser, UserDetail } from '@/lib/types'

interface UserListParams {
  page: number
  limit: number
  q?: string
  suspended?: boolean
}

export function useUsers(params: UserListParams) {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
    ...(params.q ? { q: params.q } : {}),
    ...(params.suspended !== undefined ? { suspended: String(params.suspended) } : {}),
  })

  return useQuery({
    queryKey: qk.users.list(params as Record<string, unknown>),
    queryFn: () => api.get<Paginated<TenantUser>>(`/admin/users?${searchParams}`),
  })
}

export function useUserDetail(id: string) {
  return useQuery({
    queryKey: qk.users.detail(id),
    queryFn: () => api.get<UserDetail>(`/admin/users/${id}`),
    enabled: Boolean(id),
  })
}

export function useSuspendUser() {
  return useMutation({
    mutationFn: ({ id, suspended }: { id: string; suspended: boolean }) =>
      api.patch(`/admin/users/${id}`, { suspended }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useResendVerification() {
  return useMutation({
    mutationFn: (id: string) => api.post(`/admin/users/${id}/resend-verification`),
  })
}

export function useDeleteUser() {
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.del(`/admin/users/${id}`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
