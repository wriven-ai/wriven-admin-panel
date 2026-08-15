import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { qk } from '@/lib/query-keys'
import { queryClient } from '@/lib/query-client'
import type { Paginated, AdminApiKeyRow } from '@/lib/types'

interface ApiKeyListParams {
  page: number
  limit: number
  workspaceId?: string
  projectId?: string
}

export function useApiKeys(params: ApiKeyListParams) {
  const sp = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
    ...(params.workspaceId ? { workspaceId: params.workspaceId } : {}),
    ...(params.projectId ? { projectId: params.projectId } : {}),
  })

  return useQuery({
    queryKey: qk.apiKeys.list(params),
    queryFn: () => api.get<Paginated<AdminApiKeyRow>>(`/admin/api-keys?${sp}`),
  })
}

export function useRevokeApiKey() {
  return useMutation({
    mutationFn: (id: string) => api.del(`/admin/api-keys/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['api-keys'] }),
  })
}
