import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { qk } from '@/lib/query-keys'
import { queryClient } from '@/lib/query-client'
import type {
  Paginated,
  AdminTicketRow,
  AdminTicketDetail,
  AdminSupportMetrics,
  SupportStatus,
  SupportPriority,
  SupportScope,
} from '@/lib/types'

interface TicketListParams {
  page: number
  limit: number
  q?: string
  status?: SupportStatus
  priority?: SupportPriority
  scope?: SupportScope
  workspaceId?: string
  assignee?: 'me' | 'unassigned' | string
}

export function useTickets(params: TicketListParams) {
  const sp = new URLSearchParams({ page: String(params.page), limit: String(params.limit) })
  if (params.q) sp.set('q', params.q)
  if (params.status) sp.set('status', params.status)
  if (params.priority) sp.set('priority', params.priority)
  if (params.scope) sp.set('scopeType', params.scope)
  if (params.workspaceId) sp.set('workspaceId', params.workspaceId)
  if (params.assignee) sp.set('assignee', params.assignee)

  return useQuery({
    queryKey: qk.support.list(params as Record<string, unknown>),
    queryFn: () => api.get<Paginated<AdminTicketRow>>(`/admin/support/tickets?${sp}`),
  })
}

export function useTicketDetail(id: string) {
  return useQuery({
    queryKey: qk.support.detail(id),
    queryFn: () => api.get<AdminTicketDetail>(`/admin/support/tickets/${id}`),
    enabled: Boolean(id),
  })
}

export function useSupportMetrics() {
  return useQuery({
    queryKey: qk.support.metrics(),
    queryFn: () => api.get<AdminSupportMetrics>('/admin/support/metrics'),
  })
}

export function useReplyTicket() {
  return useMutation({
    mutationFn: ({
      id,
      body,
      internalNote,
    }: {
      id: string
      body: string
      internalNote?: boolean
    }) => api.post(`/admin/support/tickets/${id}/messages`, { body, internalNote }),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: qk.support.detail(vars.id) })
      queryClient.invalidateQueries({ queryKey: ['support'] })
    },
  })
}

export function useUpdateTicket() {
  return useMutation({
    mutationFn: ({
      id,
      ...dto
    }: {
      id: string
      status?: SupportStatus
      priority?: SupportPriority
      assignedAdminId?: string | null
    }) => api.patch(`/admin/support/tickets/${id}`, dto),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: qk.support.detail(vars.id) })
      queryClient.invalidateQueries({ queryKey: ['support'] })
    },
  })
}
