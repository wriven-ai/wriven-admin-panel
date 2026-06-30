import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { qk } from '@/lib/query-keys'
import { queryClient } from '@/lib/query-client'
import type { Paginated, MediaAsset, WorkspaceStorageRow } from '@/lib/types'

interface MediaListParams {
  page: number
  limit: number
  workspaceId?: string
  kind?: string
}

export function useMediaAssets(params: MediaListParams) {
  const sp = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
    ...(params.workspaceId ? { workspaceId: params.workspaceId } : {}),
    ...(params.kind ? { kind: params.kind } : {}),
  })

  return useQuery({
    queryKey: qk.media.list(params as Record<string, unknown>),
    queryFn: () => api.get<Paginated<MediaAsset>>(`/admin/media?${sp}`),
  })
}

export function useWorkspaceStorage() {
  return useQuery({
    queryKey: ['media', 'workspace-storage'],
    queryFn: () => api.get<WorkspaceStorageRow[]>('/admin/media/usage'),
  })
}

export function usePurgeMedia() {
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.del(`/admin/media/${id}`, { reason }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['media'] }),
  })
}
