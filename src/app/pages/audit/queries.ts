import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { qk } from '@/lib/query-keys'
import type { Paginated, AuditLogView } from '@/lib/types'

interface AuditListParams {
  page: number
  limit: number
  action?: string
  targetType?: string
  from?: string
  to?: string
}

export function useAuditLog(params: AuditListParams) {
  const sp = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
    ...(params.action ? { action: params.action } : {}),
    ...(params.targetType ? { targetType: params.targetType } : {}),
    ...(params.from ? { from: params.from } : {}),
    ...(params.to ? { to: params.to } : {}),
  })

  return useQuery({
    queryKey: qk.audit.list(params),
    queryFn: () => api.get<Paginated<AuditLogView>>(`/admin/audit-log?${sp}`),
  })
}
