import { api } from "@/lib/api";
import { queryClient } from "@/lib/query-client";
import { qk } from "@/lib/query-keys";
import type {
  Paginated,
  Plan,
  WorkspaceDetail,
  WorkspaceRow,
} from "@/lib/types";
import { useMutation, useQuery } from "@tanstack/react-query";

interface WorkspaceListParams {
  page: number;
  limit: number;
  q?: string;
  status?: string;
}

export function useWorkspaces(params: WorkspaceListParams) {
  const sp = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
    ...(params.q ? { q: params.q } : {}),
    ...(params.status ? { status: params.status } : {}),
  });

  return useQuery({
    queryKey: qk.workspaces.list(params as Record<string, unknown>),
    queryFn: () => api.get<Paginated<WorkspaceRow>>(`/admin/workspaces?${sp}`),
  });
}

export function useWorkspaceDetail(id: string) {
  return useQuery({
    queryKey: qk.workspaces.detail(id),
    queryFn: () => api.get<WorkspaceDetail>(`/admin/workspaces/${id}`),
    enabled: Boolean(id),
  });
}

export function usePlans() {
  return useQuery({
    queryKey: qk.plans.list(),
    queryFn: () => api.get<Plan[]>("/admin/plans"),
  });
}

export function useSuspendWorkspace() {
  return useMutation({
    mutationFn: ({
      id,
      suspended,
      reason,
    }: {
      id: string;
      suspended: boolean;
      reason?: string;
    }) => api.patch(`/admin/workspaces/${id}`, { suspended, reason }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["workspaces"] }),
  });
}

export function useAssignPlan() {
  return useMutation({
    mutationFn: ({
      id,
      planId,
      overrides,
    }: {
      id: string;
      planId: string;
      overrides?: Record<string, number>;
    }) => api.put(`/admin/workspaces/${id}/plan`, { planId, overrides }),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.invalidateQueries({
        queryKey: qk.workspaces.detail(vars.id),
      });
    },
  });
}
