export const qk = {
  me: () => ['me'] as const,
  metrics: {
    overview: () => ['metrics', 'overview'] as const,
  },
  users: {
    list: (params: Record<string, unknown>) => ['users', params] as const,
    detail: (id: string) => ['users', id] as const,
  },
  workspaces: {
    list: (params: Record<string, unknown>) => ['workspaces', params] as const,
    detail: (id: string) => ['workspaces', id] as const,
  },
  projects: {
    list: (params: Record<string, unknown>) => ['projects', params] as const,
    detail: (id: string) => ['projects', id] as const,
  },
  content: {
    list: (params: Record<string, unknown>) => ['content', params] as const,
    detail: (id: string) => ['content', id] as const,
  },
  media: {
    list: (params: Record<string, unknown>) => ['media', params] as const,
  },
  apiKeys: {
    list: (params: Record<string, unknown>) => ['api-keys', params] as const,
  },
  webhooks: {
    list: (params: Record<string, unknown>) => ['webhooks', params] as const,
  },
  plans: {
    list: () => ['plans'] as const,
    detail: (id: string) => ['plans', id] as const,
  },
  admins: {
    list: () => ['admins'] as const,
  },
  audit: {
    list: (params: Record<string, unknown>) => ['audit', params] as const,
  },
} as const
