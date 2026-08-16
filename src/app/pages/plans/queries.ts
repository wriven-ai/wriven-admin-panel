import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { qk } from '@/lib/query-keys'
import { queryClient } from '@/lib/query-client'
import type { AdminPlanView, PlanFeatures, PlanLimits } from '@/lib/types'

export function usePlans() {
  return useQuery({
    queryKey: qk.plans.list(),
    queryFn: () => api.get<AdminPlanView[]>('/admin/plans'),
  })
}

/**
 * Create payload — mirrors `CreatePlanDto` exactly (the gateway rejects
 * unknown properties with 400). Prices are create-only: send `priceMonthly`
 * (USD dollars — the auth-service converts to cents) and optionally
 * `yearlyDiscountPercent`; the server computes `priceYearly`.
 */
export interface CreatePlanDto {
  key: string
  name: string
  description?: string
  /** USD dollars (e.g. 9.99) — converted to cents server-side. */
  priceMonthly?: number
  /** USD dollars — converted to cents server-side. */
  priceYearly?: number
  yearlyDiscountPercent?: number
  /** Tier rank — higher = more expensive. Blank = server appends above the current highest. */
  sortOrder?: number
  limits?: Record<string, number | null>
  features?: Record<string, unknown>
}

/** Update payload — mirrors `UpdatePlanDto` exactly. No prices, no key. */
export interface UpdatePlanDto {
  name?: string
  description?: string
  active?: boolean
  /** Tier rank — higher = more expensive. Blank = leave unchanged. */
  sortOrder?: number
  limits?: PlanLimits
  features?: PlanFeatures
}

export function useCreatePlan() {
  return useMutation({
    mutationFn: (payload: CreatePlanDto) =>
      api.post<AdminPlanView>('/admin/plans', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.plans.list() }),
  })
}

export function useUpdatePlan() {
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdatePlanDto & { id: string }) =>
      api.patch<AdminPlanView>(`/admin/plans/${id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.plans.list() }),
  })
}
