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
  revisionsPerEntry?: number | null
  aiTextRequestsPerMonth?: number | null
  aiImageRequestsPerMonth?: number | null
}

export interface PlanFeatures {
  scheduledPublishing?: boolean
  revisionHistory?: boolean
  customRoles?: boolean
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
  /** FINAL yearly amount Stripe charges (cents). */
  priceYearly: number | null
  /** Yearly pricing breakdown — null = explicit/absent yearly, no discount. */
  yearlyDiscountPercent: number | null
  yearlyDiscountAmount: number | null
  currency: string
  trialDays: number
  limits: PlanLimits
  features: PlanFeatures
}

/** `GET/POST/PATCH /admin/plans` — adds the Stripe linkage the tenant view omits. */
export interface AdminPlanView extends PlanView {
  stripeProductId: string | null
  stripePriceIdMonthly: string | null
  stripePriceIdYearly: string | null
}

/** Ordered limit dimensions shared by the form + detail sheet. */
export const PLAN_LIMIT_KEYS: { key: keyof PlanLimits; label: string }[] = [
  { key: 'projects', label: 'Projects' },
  { key: 'members', label: 'Members' },
  { key: 'environments', label: 'Environments' },
  { key: 'contentTypes', label: 'Content types' },
  { key: 'entries', label: 'Entries' },
  { key: 'locales', label: 'Locales' },
  { key: 'storageMb', label: 'Storage (MB)' },
  { key: 'assetBandwidthGb', label: 'Asset bandwidth (GB)' },
  { key: 'apiRequestsPerMonth', label: 'API requests / month' },
  { key: 'apiKeys', label: 'API keys' },
  { key: 'webhooks', label: 'Webhooks' },
  { key: 'revisionsPerEntry', label: 'Revisions / entry' },
  { key: 'aiTextRequestsPerMonth', label: 'AI text requests / month' },
  { key: 'aiImageRequestsPerMonth', label: 'AI image requests / month' },
]

/** Feature entitlements shared by the form + detail sheet. */
export const PLAN_FEATURE_DEFS: (
  | { key: Exclude<keyof PlanFeatures, 'supportTier'>; label: string; type: 'boolean' }
  | { key: 'supportTier'; label: string; type: 'tier'; options: PlanFeatures['supportTier'][] }
)[] = [
  { key: 'scheduledPublishing', label: 'Scheduled publishing', type: 'boolean' },
  { key: 'revisionHistory', label: 'Revision history', type: 'boolean' },
  { key: 'customRoles', label: 'Custom roles', type: 'boolean' },
  { key: 'auditLog', label: 'Audit log', type: 'boolean' },
  { key: 'previewApi', label: 'Preview API', type: 'boolean' },
  {
    key: 'supportTier',
    label: 'Support tier',
    type: 'tier',
    options: ['community', 'email', 'priority'],
  },
]

/**
 * Yearly price from a discount percent — MUST stay identical to the
 * server-side computation in auth-service `AdminPlansService.create`.
 */
export function computeYearlyPrice(
  monthlyCents: number,
  discountPercent: number,
): { priceYearly: number; discountAmount: number } {
  const fullYear = monthlyCents * 12
  const priceYearly = Math.round(fullYear * (1 - discountPercent / 100))
  return { priceYearly, discountAmount: fullYear - priceYearly }
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

// ── Support Tickets ───────────────────────────────────────────────────────────
export type SupportStatus = 'open' | 'pending' | 'resolved' | 'closed'
export type SupportPriority = 'low' | 'normal' | 'high' | 'urgent'
export type SupportScope = 'general' | 'project' | 'billing' | 'account' | 'technical'

export interface AdminTicketAttachment {
  id: string
  url: string
  mime: string | null
  sizeBytes: number | null
  originalFilename: string | null
}

export interface AdminTicketRow {
  id: string
  number: number
  subject: string
  workspaceName: string
  authorEmail: string
  scopeType: SupportScope
  status: SupportStatus
  priority: SupportPriority
  assignedAdminId: string | null
  assignedAdminName: string | null
  lastReplyAt: string | null
  lastReplyBy: 'user' | 'admin' | null
  createdAt: string
}

export interface AdminTicketMessage {
  id: string
  authorType: 'user' | 'admin'
  authorName: string
  body: string
  isInternalNote: boolean
  createdAt: string
  attachments: AdminTicketAttachment[]
}

export interface AdminTicketDetail extends AdminTicketRow {
  description: string
  workspaceId: string
  authorId: string
  attachments: AdminTicketAttachment[]
  messages: AdminTicketMessage[]
}

export interface AdminSupportMetrics {
  open: number
  unassigned: number
  awaitingCustomer: number
}

// ── DTOs ──────────────────────────────────────────────────────────────────────
export interface AssignPlanDto {
  planKey: string
  status?: 'active' | 'trialing' | 'past_due' | 'canceled' | 'paused' | 'incomplete'
  overrides?: Record<string, number | null>
}
