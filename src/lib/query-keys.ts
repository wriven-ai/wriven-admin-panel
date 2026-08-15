export const qk = {
  me: () => ['me'] as const,
  metrics: {
    overview: () => ['metrics', 'overview'] as const,
  },
  users: {
    list: (params: object) => ['users', params] as const,
    detail: (id: string) => ['users', id] as const,
  },
  workspaces: {
    list: (params: object) => ['workspaces', params] as const,
    detail: (id: string) => ['workspaces', id] as const,
  },
  projects: {
    list: (params: object) => ['projects', params] as const,
    detail: (id: string) => ['projects', id] as const,
    usage: (id: string) => ['projects', id, 'usage'] as const,
  },
  content: {
    list: (params: object) => ['content', params] as const,
    detail: (id: string) => ['content', id] as const,
  },
  contentTypes: {
    list: (params: object) => ['content-types', params] as const,
  },
  media: {
    list: (params: object) => ['media', params] as const,
  },
  apiKeys: {
    list: (params: object) => ['api-keys', params] as const,
  },
  webhooks: {
    list: (params: object) => ['webhooks', params] as const,
  },
  plans: {
    list: () => ['plans'] as const,
    detail: (id: string) => ['plans', id] as const,
  },
  admins: {
    list: () => ['admins'] as const,
  },
  audit: {
    list: (params: object) => ['audit', params] as const,
  },
  support: {
    list: (params: object) => ['support', params] as const,
    detail: (id: string) => ['support', id] as const,
    metrics: () => ['support', 'metrics'] as const,
  },
} as const
