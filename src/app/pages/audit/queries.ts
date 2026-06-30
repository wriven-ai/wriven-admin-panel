import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { qk } from '@/lib/query-keys'
import type { Paginated, AuditEvent } from '@/lib/types'

interface AuditListParams {
  page: number
  limit: number
  adminUserId?: string
  action?: string
  targetType?: string
  from?: string
  to?: string
}

export function useAuditLog(params: AuditListParams) {
  const sp = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
    ...(params.adminUserId ? { adminUserId: params.adminUserId } : {}),
    ...(params.action ? { action: params.action } : {}),
    ...(params.targetType ? { targetType: params.targetType } : {}),
    ...(params.from ? { from: params.from } : {}),
    ...(params.to ? { to: params.to } : {}),
  })

  return useQuery({
    queryKey: qk.audit.list(params as Record<string, unknown>),
    queryFn: () => api.get<Paginated<AuditEvent>>(`/admin/audit-log?${sp}`),
  })
}
