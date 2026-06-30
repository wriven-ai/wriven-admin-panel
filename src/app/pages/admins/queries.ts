import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { qk } from '@/lib/query-keys'
import { queryClient } from '@/lib/query-client'
import type { AdminUser, AdminRole } from '@/lib/types'

export function useAdmins() {
  return useQuery({
    queryKey: qk.admins.list(),
    queryFn: () => api.get<AdminUser[]>('/admin/admins'),
  })
}

export function useInviteAdmin() {
  return useMutation({
    mutationFn: (payload: { email: string; name: string; role: AdminRole }) =>
      api.post<AdminUser>('/admin/admins', payload),
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
      resetMfa?: boolean
    }) => api.patch<AdminUser>(`/admin/admins/${id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.admins.list() }),
  })
}

export function useDeleteAdmin() {
  return useMutation({
    mutationFn: (id: string) => api.del(`/admin/admins/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.admins.list() }),
  })
}
