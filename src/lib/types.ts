export type AdminRole = 'admin' | 'moderator' | 'member'

export interface Paginated<T> {
  items: T[]
  page: number
  limit: number
  total: number
}

// ── Admin identity (platform staff) ──────────────────────────────────────────
export interface AdminView {
  id: string
  email: string
  name: string
  role: AdminRole
  active: boolean
  lastLoginAt: string | null
  createdAt: string
}

export interface AdminMeResponse extends AdminView {
  csrfToken: string | null
}

// ── Tenant users ──────────────────────────────────────────────────────────────
export interface AdminUserRow {
  id: string
  email: string
  name: string
  provider: string
  emailVerified: boolean
  suspended: boolean
  workspaceCount: number
  createdAt: string
}

export interface AdminUserDetail extends AdminUserRow {
  workspaces: { id: string; name: string; slug: string; role: string }[]
  projects: { id: string; name: string; workspaceId: string; role: string }[]
}

// ── Workspaces ────────────────────────────────────────────────────────────────
export interface AdminWorkspaceRow {
  id: string
  name: string
  slug: string
  ownerId: string
  ownerEmail: string | null
  memberCount: number
  projectCount: number
  planKey: string | null
  planName: string | null
  subscriptionStatus: string | null
  createdAt: string
}

export interface AdminWorkspaceDetail extends AdminWorkspaceRow {
  members: { userId: string; email: string; name: string; role: string }[]
  projects: { id: string; name: string; slug: string }[]
}

// ── Projects ──────────────────────────────────────────────────────────────────
export interface AdminProjectRow {
  id: string
  name: string
  slug: string
  workspaceId: string
  workspaceName: string | null
  createdBy: string
  deleted: boolean
  createdAt: string
}

// ── Content ───────────────────────────────────────────────────────────────────
export interface AdminEntryRow {
  id: string
  workspaceId: string
  projectId: string
  contentTypeId: string
  slug: string
  status: 'draft' | 'published' | 'archived'
  authorId: string
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface AdminEntryDetail extends AdminEntryRow {
  data: Record<string, unknown>
}

// ── Media ─────────────────────────────────────────────────────────────────────
export interface AdminMediaRow {
  id: string
  workspaceId: string
  projectId: string
  kind: string
  mime: string | null
  sizeBytes: number | null
  originalFilename: string | null
  uploadedBy: string
  createdAt: string
}

export interface AdminMediaUsageRow {
  workspaceId: string
  assetCount: number
  totalBytes: number
}

// ── API Keys ──────────────────────────────────────────────────────────────────
export interface AdminApiKeyRow {
  id: string
  workspaceId: string
  projectId: string
  name: string
  prefix: string
  scope: string
  lastUsedAt: string | null
  revokedAt: string | null
  createdAt: string
}

// ── Webhooks ──────────────────────────────────────────────────────────────────
export interface AdminWebhookRow {
  id: string
  workspaceId: string
  projectId: string
  url: string
  events: string[]
  active: boolean
  lastStatus: number | null
  lastFiredAt: string | null
  createdAt: string
}

// ── Plans ─────────────────────────────────────────────────────────────────────
export interface PlanLimits {
  projects?: number | null
  members?: number | null
  environments?: number | null
  contentTypes?: number | null
  entries?: number | null
  locales?: number | null
  storageMb?: number | null
  assetBandwidthGb?: number | null
  apiRequestsPerMonth?: number | null
  apiKeys?: number | null
  webhooks?: number | null
}

export interface PlanFeatures {
  scheduledPublishing?: boolean
  revisionHistory?: boolean
  customRoles?: boolean
  sso?: boolean
  auditLog?: boolean
  previewApi?: boolean
  supportTier?: 'community' | 'email' | 'priority'
}

export interface PlanView {
  id: string
  key: string
  name: string
  description: string | null
  sortOrder: number
  isPublic: boolean
  active: boolean
  priceMonthly: number | null
  priceYearly: number | null
  currency: string
  trialDays: number
  limits: PlanLimits
  features: PlanFeatures
}

// ── Audit ─────────────────────────────────────────────────────────────────────
export interface AuditLogView {
  id: string
  adminUserId: string
  adminEmail: string | null
  action: string
  targetType: string | null
  targetId: string | null
  metadata: Record<string, unknown>
  ip: string | null
  createdAt: string
}

// ── Metrics ───────────────────────────────────────────────────────────────────
export interface AdminMetricsOverview {
  users: { total: number; verified: number }
  workspaces: { total: number }
  projects: { total: number }
  content: { entries: number; published: number }
  media: { totalBytes: number }
  plans: { key: string; name: string; count: number }[]
}

// ── DTOs ──────────────────────────────────────────────────────────────────────
export interface AssignPlanDto {
  planKey: string
  status?: 'active' | 'trialing' | 'past_due' | 'canceled' | 'paused' | 'incomplete'
  overrides?: Record<string, number | null>
}
