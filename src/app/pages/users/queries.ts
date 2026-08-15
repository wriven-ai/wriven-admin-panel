import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { qk } from '@/lib/query-keys'
import { queryClient } from '@/lib/query-client'
import type { Paginated, AdminUserRow, AdminUserDetail } from '@/lib/types'

interface UserListParams {
  page: number
  limit: number
  q?: string
  suspended?: boolean
}

export function useUsers(params: UserListParams) {
  const sp = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
    ...(params.q ? { q: params.q } : {}),
    ...(params.suspended !== undefined ? { suspended: String(params.suspended) } : {}),
  })

  return useQuery({
    queryKey: qk.users.list(params),
    queryFn: () => api.get<Paginated<AdminUserRow>>(`/admin/users?${sp}`),
  })
}

export function useUserDetail(id: string) {
  return useQuery({
    queryKey: qk.users.detail(id),
    queryFn: () => api.get<AdminUserDetail>(`/admin/users/${id}`),
    enabled: Boolean(id),
  })
}

export function useUpdateUser() {
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string
      suspended?: boolean
      emailVerified?: boolean
    }) => api.patch(`/admin/users/${id}`, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useDeleteUser() {
  return useMutation({
    mutationFn: (id: string) => api.del(`/admin/users/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
}
