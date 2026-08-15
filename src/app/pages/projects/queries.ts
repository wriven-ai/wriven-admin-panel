import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { qk } from '@/lib/query-keys'
import { queryClient } from '@/lib/query-client'
import type { Paginated, AdminProjectRow, AdminProjectUsage } from '@/lib/types'

export function useProjectDetail(id: string) {
  return useQuery({
    queryKey: qk.projects.detail(id),
    queryFn: () => api.get<AdminProjectRow>(`/admin/projects/${id}`),
    enabled: Boolean(id),
  })
}

export function useProjectUsage(id: string) {
  return useQuery({
    queryKey: qk.projects.usage(id),
    queryFn: () => api.get<AdminProjectUsage>(`/admin/projects/${id}/usage`),
    enabled: Boolean(id),
  })
}

interface ProjectListParams {
  page: number
  limit: number
  q?: string
  workspaceId?: string
}

export function useProjects(params: ProjectListParams) {
  const sp = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
    ...(params.q ? { q: params.q } : {}),
    ...(params.workspaceId ? { workspaceId: params.workspaceId } : {}),
  })

  return useQuery({
    queryKey: qk.projects.list(params),
    queryFn: () => api.get<Paginated<AdminProjectRow>>(`/admin/projects?${sp}`),
  })
}

export function useDeleteProject() {
  return useMutation({
    mutationFn: (id: string) => api.del(`/admin/projects/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  })
}
