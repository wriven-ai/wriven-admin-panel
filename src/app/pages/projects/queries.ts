import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { qk } from '@/lib/query-keys'
import { queryClient } from '@/lib/query-client'
import type { Paginated, AdminProjectRow } from '@/lib/types'

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
