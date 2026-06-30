import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { qk } from '@/lib/query-keys'
import { queryClient } from '@/lib/query-client'
import type { Plan, PlanLimits } from '@/lib/types'

export function usePlans() {
  return useQuery({
    queryKey: qk.plans.list(),
    queryFn: () => api.get<Plan[]>('/admin/plans'),
  })
}

interface PlanPayload {
  key: string
  name: string
  priceMonthly: number | null
  limits: PlanLimits
  active: boolean
}

export function useCreatePlan() {
  return useMutation({
    mutationFn: (payload: PlanPayload) => api.post<Plan>('/admin/plans', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.plans.list() }),
  })
}

export function useUpdatePlan() {
  return useMutation({
    mutationFn: ({ id, ...payload }: PlanPayload & { id: string }) =>
      api.patch<Plan>(`/admin/plans/${id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.plans.list() }),
  })
}
