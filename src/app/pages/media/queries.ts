import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { qk } from '@/lib/query-keys'
import { queryClient } from '@/lib/query-client'
import type { Paginated, AdminMediaRow, AdminMediaUsageRow } from '@/lib/types'

interface MediaListParams {
  page: number
  limit: number
  workspaceId?: string
  projectId?: string
}

export function useMediaAssets(params: MediaListParams) {
  const sp = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
    ...(params.workspaceId ? { workspaceId: params.workspaceId } : {}),
    ...(params.projectId ? { projectId: params.projectId } : {}),
  })

  return useQuery({
    queryKey: qk.media.list(params),
    queryFn: () => api.get<Paginated<AdminMediaRow>>(`/admin/media?${sp}`),
  })
}

export function useWorkspaceStorage() {
  return useQuery({
    queryKey: ['media', 'workspace-storage'],
    queryFn: () => api.get<AdminMediaUsageRow[]>('/admin/media/usage'),
  })
}

export function usePurgeMedia() {
  return useMutation({
    mutationFn: (id: string) => api.del(`/admin/media/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['media'] }),
  })
}
