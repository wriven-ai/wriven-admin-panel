import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { qk } from '@/lib/query-keys'
import { queryClient } from '@/lib/query-client'
import type { PlanView } from '@/lib/types'

export function usePlans() {
  return useQuery({
    queryKey: qk.plans.list(),
    queryFn: () => api.get<PlanView[]>('/admin/plans'),
  })
}

interface CreatePlanDto {
  key: string
  name: string
  description?: string
  priceMonthly?: number | null
  priceYearly?: number | null
  active?: boolean
  limits?: Record<string, number | null>
  features?: Record<string, unknown>
}

interface UpdatePlanDto {
  name?: string
  description?: string
  priceMonthly?: number | null
  priceYearly?: number | null
  active?: boolean
  limits?: Record<string, number | null>
  features?: Record<string, unknown>
}

export function useCreatePlan() {
  return useMutation({
    mutationFn: (payload: CreatePlanDto) => api.post<PlanView>('/admin/plans', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.plans.list() }),
  })
}

export function useUpdatePlan() {
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdatePlanDto & { id: string }) =>
      api.patch<PlanView>(`/admin/plans/${id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.plans.list() }),
  })
}
