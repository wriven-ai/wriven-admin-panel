import { ArrowLeft } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatBytes, formatDate } from '@/lib/format'
import { ApiKeysTab } from '@/components/admin-tabs/ApiKeysTab'
import { ContentTab } from '@/components/admin-tabs/ContentTab'
import { ContentTypesTab } from '@/components/admin-tabs/ContentTypesTab'
import { MediaTab } from '@/components/admin-tabs/MediaTab'
import { WebhooksTab } from '@/components/admin-tabs/WebhooksTab'
import { MembersTab } from './components/tabs/MembersTab'
import { PlanTab } from './components/tabs/PlanTab'
import { ProjectsTab } from './components/tabs/ProjectsTab'
import { useWorkspaceDetail } from './queries'
import { useWorkspaceStorage } from '../media/queries'

const TAB_VALUES = [
  'projects',
  'members',
  'content-types',
  'content',
  'media',
  'api-keys',
  'webhooks',
  'plan',
] as const
type TabValue = (typeof TAB_VALUES)[number]

const TAB_LABELS: Record<TabValue, string> = {
  projects: 'Projects',
  members: 'Members',
  'content-types': 'Content Types',
  content: 'Content',
  media: 'Media',
  'api-keys': 'API Keys',
  webhooks: 'Webhooks',
  plan: 'Plan',
}

function statusVariant(s: string | null) {
  if (s === 'active') return 'success' as const
  if (s === 'past_due') return 'warning' as const
  if (s === 'canceled' || s === 'paused') return 'error' as const
  if (s === 'trialing') return 'secondary' as const
  return 'outline' as const
}

export function WorkspaceDetailPage() {
  const { id = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()

  const { data: detail, isLoading } = useWorkspaceDetail(id)
  const { data: usage } = useWorkspaceStorage()

  const raw = searchParams.get('tab')
  const tab: TabValue = TAB_VALUES.includes(raw as TabValue) ? (raw as TabValue) : 'projects'

  const wsUsage = usage?.find((u) => u.workspaceId === id)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link to="/workspaces">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <p className="text-xs text-muted-foreground">Workspaces</p>
      </div>

      <PageHeader
        title={isLoading ? 'Workspace…' : (detail?.name ?? 'Workspace')}
        description={detail ? `/${detail.slug} · ${detail.ownerEmail ?? 'unknown owner'}` : undefined}
      />

      {detail && (
        <div className="flex flex-wrap items-center gap-4">
          <Badge variant={statusVariant(detail.subscriptionStatus)}>
            {detail.subscriptionStatus?.replace('_', ' ') ?? 'no subscription'}
          </Badge>
          {detail.planKey && <Badge variant="outline">{detail.planKey}</Badge>}
        </div>
      )}

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border bg-card p-3 text-center">
          <dd className="text-lg font-semibold tabular-nums">{detail?.memberCount ?? '—'}</dd>
          <dt className="text-2xs text-muted-foreground">Members</dt>
        </div>
        <div className="rounded-lg border bg-card p-3 text-center">
          <dd className="text-lg font-semibold tabular-nums">{detail?.projectCount ?? '—'}</dd>
          <dt className="text-2xs text-muted-foreground">Projects</dt>
        </div>
        <div className="rounded-lg border bg-card p-3 text-center">
          <dd className="text-lg font-semibold tabular-nums">
            {wsUsage ? formatBytes(wsUsage.totalBytes) : '—'}
          </dd>
          <dt className="text-2xs text-muted-foreground">Storage</dt>
        </div>
        <div className="rounded-lg border bg-card p-3 text-center">
          <dd className="text-sm font-semibold">{detail ? formatDate(detail.createdAt) : '—'}</dd>
          <dt className="text-2xs text-muted-foreground">Created</dt>
        </div>
      </dl>

      <Tabs
        value={tab}
        onValueChange={(value) => setSearchParams(value ? { tab: value } : {}, { replace: true })}
      >
        <TabsList variant="line">
          {TAB_VALUES.map((t) => (
            <TabsTrigger key={t} value={t}>
              {TAB_LABELS[t]}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="projects">
          <div className="pt-4"><ProjectsTab workspaceId={id} /></div>
        </TabsContent>
        <TabsContent value="members">
          <div className="pt-4">
            {detail ? <MembersTab detail={detail} /> : (
              <p className="text-sm text-muted-foreground">Loading members…</p>
            )}
          </div>
        </TabsContent>
        <TabsContent value="content-types">
          <div className="pt-4"><ContentTypesTab workspaceId={id} /></div>
        </TabsContent>
        <TabsContent value="content">
          <div className="pt-4"><ContentTab workspaceId={id} /></div>
        </TabsContent>
        <TabsContent value="media">
          <div className="pt-4"><MediaTab workspaceId={id} /></div>
        </TabsContent>
        <TabsContent value="api-keys">
          <div className="pt-4"><ApiKeysTab workspaceId={id} /></div>
        </TabsContent>
        <TabsContent value="webhooks">
          <div className="pt-4"><WebhooksTab workspaceId={id} /></div>
        </TabsContent>
        <TabsContent value="plan">
          <div className="pt-4">
            {detail ? <PlanTab workspace={detail} /> : (
              <p className="text-sm text-muted-foreground">Loading plan…</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
