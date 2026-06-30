export type AdminRole = 'admin' | 'moderator' | 'member'

export interface AdminMe {
  adminUserId: string
  email: string
  name: string
  role: AdminRole
}

export interface Paginated<T> {
  items: T[]
  page: number
  limit: number
  total: number
}

export interface PlanLimits {
  projects?: number
  members?: number
  storageMb?: number
  entries?: number
  apiKeys?: number
  webhooks?: number
}

export interface Plan {
  id: string
  key: string
  name: string
  limits: PlanLimits
  priceMonthly: number | null
  active: boolean
  createdAt: string
}

export type WorkspacePlanStatus = 'active' | 'past_due' | 'suspended' | 'trialing'

export interface AdminUser {
  id: string
  email: string
  name: string
  role: AdminRole
  active: boolean
  mfaEnabled: boolean
  lastLoginAt: string | null
  createdAt: string
}

export type AuditTargetType =
  | 'user'
  | 'workspace'
  | 'project'
  | 'entry'
  | 'api_key'
  | 'webhook'
  | 'admin_user'
  | 'plan'

export interface AuditEvent {
  id: string
  adminUserId: string
  adminEmail: string
  action: string
  targetType: AuditTargetType | null
  targetId: string | null
  metadata: Record<string, unknown>
  ip: string | null
  createdAt: string
}

export interface TenantUser {
  id: string
  email: string
  name: string
  provider: 'local' | 'google'
  emailVerified: boolean
  suspended: boolean
  workspaceCount: number
  createdAt: string
}

export interface UserMembership {
  workspaceId: string
  workspaceName: string
  role: string
}

export interface UserDetail extends TenantUser {
  memberships: UserMembership[]
}

export interface WorkspaceRow {
  id: string
  name: string
  slug: string
  ownerEmail: string
  memberCount: number
  projectCount: number
  storageUsedMb: number
  planKey: string
  status: WorkspacePlanStatus
  createdAt: string
}

export interface WorkspaceMember {
  userId: string
  email: string
  name: string
  role: string
}

export interface WorkspaceDetail extends WorkspaceRow {
  members: WorkspaceMember[]
  plan: Plan | null
  overrides: PlanLimits | null
}

export interface ProjectRow {
  id: string
  name: string
  workspaceId: string
  workspaceName: string
  typeCount: number
  entryCount: number
  keyCount: number
  webhookCount: number
  createdByEmail: string
  status: string
  createdAt: string
}

export interface ContentEntryRow {
  id: string
  title: string
  slug: string
  type: string
  workspaceId: string
  workspaceName: string
  projectId: string
  projectName: string
  status: 'draft' | 'published' | 'archived'
  updatedAt: string
}

export type MediaKind = 'image' | 'video' | 'file'

export interface WorkspaceStorageRow {
  workspaceId: string
  workspaceName: string
  usedBytes: number
  capBytes: number
  fileCount: number
}

export interface MediaAsset {
  id: string
  workspaceId: string
  workspaceName: string
  kind: MediaKind
  sizeBytes: number
  key: string
  createdAt: string
}

export interface MediaTotals {
  totalBytes: number
  byKind: Record<MediaKind, number>
}

export type ApiKeyScope = 'read' | 'preview' | 'manage'

export interface ApiKeyRow {
  id: string
  prefix: string
  scope: ApiKeyScope
  projectId: string
  projectName: string
  workspaceName: string
  lastUsedAt: string | null
  createdAt: string
  revoked: boolean
}

export interface WebhookRow {
  id: string
  url: string
  events: string[]
  projectId: string
  projectName: string
  workspaceName: string
  lastStatusCode: number | null
  lastFiredAt: string | null
  active: boolean
}

export interface OverviewMetrics {
  totals: {
    users: number
    workspaces: number
    projects: number
    entries: number
    storageBytes: number
    activePlans: number
  }
  growth: Array<{ date: string; users: number; workspaces: number }>
  planBreakdown: Array<{ planKey: string; planName: string; count: number }>
  recentAudit: AuditEvent[]
  failingWebhooks: WebhookRow[]
}
