import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { qk } from '@/lib/query-keys'
import { queryClient } from '@/lib/query-client'
import type { Paginated, AdminWebhookRow } from '@/lib/types'

interface WebhookListParams {
  page: number
  limit: number
  workspaceId?: string
  projectId?: string
}

export function useWebhooks(params: WebhookListParams) {
  const sp = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
    ...(params.workspaceId ? { workspaceId: params.workspaceId } : {}),
    ...(params.projectId ? { projectId: params.projectId } : {}),
  })

  return useQuery({
    queryKey: qk.webhooks.list(params),
    queryFn: () => api.get<Paginated<AdminWebhookRow>>(`/admin/webhooks?${sp}`),
  })
}

export function useDisableWebhook() {
  return useMutation({
    mutationFn: (id: string) => api.patch(`/admin/webhooks/${id}/disable`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['webhooks'] }),
  })
}
