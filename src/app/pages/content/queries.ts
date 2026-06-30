import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { qk } from '@/lib/query-keys'
import { queryClient } from '@/lib/query-client'
import type { Paginated, ContentEntryRow } from '@/lib/types'

interface ContentListParams {
  page: number
  limit: number
  q?: string
  status?: string
  workspaceId?: string
}

export function useContent(params: ContentListParams) {
  const sp = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
    ...(params.q ? { q: params.q } : {}),
    ...(params.status ? { status: params.status } : {}),
    ...(params.workspaceId ? { workspaceId: params.workspaceId } : {}),
  })

  return useQuery({
    queryKey: qk.content.list(params as Record<string, unknown>),
    queryFn: () => api.get<Paginated<ContentEntryRow>>(`/admin/content?${sp}`),
  })
}

export function useTakedownContent() {
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.patch(`/admin/content/${id}`, { status: 'archived', reason }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['content'] }),
  })
}
