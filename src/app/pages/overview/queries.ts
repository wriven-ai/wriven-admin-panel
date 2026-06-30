import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { qk } from '@/lib/query-keys'
import type { OverviewMetrics } from '@/lib/types'

export function useOverviewMetrics() {
  return useQuery({
    queryKey: qk.metrics.overview(),
    queryFn: () => api.get<OverviewMetrics>('/admin/metrics/overview'),
  })
}
