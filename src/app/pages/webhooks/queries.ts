import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { qk } from '@/lib/query-keys'
import { queryClient } from '@/lib/query-client'
import type { Paginated, WebhookRow } from '@/lib/types'

interface WebhookListParams {
  page: number
  limit: number
  active?: boolean
  failing?: boolean
}

export function useWebhooks(params: WebhookListParams) {
  const sp = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
    ...(params.active !== undefined ? { active: String(params.active) } : {}),
    ...(params.failing ? { failing: 'true' } : {}),
  })

  return useQuery({
    queryKey: qk.webhooks.list(params as Record<string, unknown>),
    queryFn: () => api.get<Paginated<WebhookRow>>(`/admin/webhooks?${sp}`),
  })
}

export function useDisableWebhook() {
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.patch(`/admin/webhooks/${id}`, { active: false, reason }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['webhooks'] }),
  })
}
