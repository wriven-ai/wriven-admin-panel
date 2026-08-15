import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { qk } from '@/lib/query-keys'
import { queryClient } from '@/lib/query-client'
import type { Paginated, AdminEntryRow, AdminEntryDetail } from '@/lib/types'

interface ContentListParams {
  page: number
  limit: number
  status?: string
  workspaceId?: string
  projectId?: string
  contentTypeId?: string
}

export function useContent(params: ContentListParams) {
  const sp = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
    ...(params.status ? { status: params.status } : {}),
    ...(params.workspaceId ? { workspaceId: params.workspaceId } : {}),
    ...(params.projectId ? { projectId: params.projectId } : {}),
    ...(params.contentTypeId ? { contentTypeId: params.contentTypeId } : {}),
  })

  return useQuery({
    queryKey: qk.content.list(params),
    queryFn: () => api.get<Paginated<AdminEntryRow>>(`/admin/content?${sp}`),
  })
}

export function useContentDetail(id: string) {
  return useQuery({
    queryKey: qk.content.detail(id),
    queryFn: () => api.get<AdminEntryDetail>(`/admin/content/${id}`),
    enabled: Boolean(id),
  })
}

export function useTakedownContent() {
  return useMutation({
    mutationFn: (id: string) =>
      api.patch(`/admin/content/${id}`, { status: 'archived' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['content'] }),
  })
}
