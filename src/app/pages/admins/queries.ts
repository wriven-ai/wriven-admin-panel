import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { qk } from '@/lib/query-keys'
import { queryClient } from '@/lib/query-client'
import type { Paginated, AdminView, AdminRole } from '@/lib/types'

interface AdminListParams {
  page: number
  limit: number
  q?: string
}

export function useAdmins(params: AdminListParams = { page: 1, limit: 50 }) {
  const sp = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
    ...(params.q ? { q: params.q } : {}),
  })

  return useQuery({
    queryKey: qk.admins.list(),
    queryFn: () => api.get<Paginated<AdminView>>(`/admin/admins?${sp}`),
  })
}

export function useInviteAdmin() {
  return useMutation({
    mutationFn: (payload: { email: string; name: string; password: string; role: AdminRole }) =>
      api.post<AdminView>('/admin/admins', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.admins.list() }),
  })
}

export function useUpdateAdmin() {
  return useMutation({
    mutationFn: ({
      id,
      ...payload
    }: {
      id: string
      role?: AdminRole
      active?: boolean
    }) => api.patch<AdminView>(`/admin/admins/${id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.admins.list() }),
  })
}

export function useDeleteAdmin() {
  return useMutation({
    mutationFn: (id: string) => api.del(`/admin/admins/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.admins.list() }),
  })
}
