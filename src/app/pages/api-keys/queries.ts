import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { qk } from '@/lib/query-keys'
import { queryClient } from '@/lib/query-client'
import type { Paginated, ApiKeyRow } from '@/lib/types'

interface ApiKeyListParams {
  page: number
  limit: number
  revoked?: boolean
  scope?: string
}

export function useApiKeys(params: ApiKeyListParams) {
  const sp = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
    ...(params.revoked !== undefined ? { revoked: String(params.revoked) } : {}),
    ...(params.scope ? { scope: params.scope } : {}),
  })

  return useQuery({
    queryKey: qk.apiKeys.list(params as Record<string, unknown>),
    queryFn: () => api.get<Paginated<ApiKeyRow>>(`/admin/api-keys?${sp}`),
  })
}

export function useRevokeApiKey() {
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.del(`/admin/api-keys/${id}`, { reason }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['api-keys'] }),
  })
}
