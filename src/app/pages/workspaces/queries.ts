import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { qk } from '@/lib/query-keys'
import { queryClient } from '@/lib/query-client'
import type { Paginated, AdminWorkspaceRow, AdminWorkspaceDetail, PlanView, AssignPlanDto } from '@/lib/types'

interface WorkspaceListParams {
  page: number
  limit: number
  q?: string
}

export function useWorkspaces(params: WorkspaceListParams) {
  const sp = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
    ...(params.q ? { q: params.q } : {}),
  })

  return useQuery({
    queryKey: qk.workspaces.list(params as Record<string, unknown>),
    queryFn: () => api.get<Paginated<AdminWorkspaceRow>>(`/admin/workspaces?${sp}`),
  })
}

export function useWorkspaceDetail(id: string) {
  return useQuery({
    queryKey: qk.workspaces.detail(id),
    queryFn: () => api.get<AdminWorkspaceDetail>(`/admin/workspaces/${id}`),
    enabled: Boolean(id),
  })
}

export function usePlans() {
  return useQuery({
    queryKey: qk.plans.list(),
    queryFn: () => api.get<PlanView[]>('/admin/plans'),
  })
}

export function useAssignPlan() {
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: AssignPlanDto }) =>
      api.put(`/admin/workspaces/${id}/plan`, dto),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
      queryClient.invalidateQueries({ queryKey: qk.workspaces.detail(vars.id) })
    },
  })
}
