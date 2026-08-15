import { ArrowLeft } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatBytes, formatDate } from '@/lib/format'
import { MembersTab } from './components/tabs/MembersTab'
import { PlanTab } from './components/tabs/PlanTab'
import { ProjectsTab } from './components/tabs/ProjectsTab'
import { useWorkspaceDetail } from './queries'
import { useWorkspaceStorage } from '../media/queries'

const TAB_LABELS = {
  projects: 'Projects',
  members: 'Members',
  plan: 'Plan',
} as const
const TAB_VALUES = Object.keys(TAB_LABELS) as (keyof typeof TAB_LABELS)[]
type TabValue = (typeof TAB_VALUES)[number]

function statusVariant(s: string | null) {
  if (s === 'active') return 'success' as const
  if (s === 'past_due') return 'warning' as const
  if (s === 'canceled' || s === 'paused') return 'error' as const
  if (s === 'trialing') return 'secondary' as const
  return 'outline' as const
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-5 first:pl-0 last:pr-0">
      <dd className="text-lg font-semibold tabular-nums text-foreground">{value}</dd>
      <dt className="text-2xs uppercase tracking-wide text-muted-foreground">{label}</dt>
    </div>
  )
}

export function WorkspaceDetailPage() {
  const { id = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()

  const { data: detail, isLoading } = useWorkspaceDetail(id)
  const { data: usage } = useWorkspaceStorage()

  const raw = searchParams.get('tab')
  const tab: TabValue = TAB_VALUES.includes(raw as TabValue) ? (raw as TabValue) : 'projects'

  const wsUsage = usage?.find((u) => u.workspaceId === id)

  const tabLabel = (t: TabValue) => {
    const count =
      t === 'members' ? detail?.memberCount : t === 'projects' ? detail?.projectCount : undefined
    return count != null ? `${TAB_LABELS[t]} · ${count}` : TAB_LABELS[t]
  }

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <Link
        to="/workspaces"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Workspaces
      </Link>

      {/* Title row with inline stats on the right */}
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {isLoading ? 'Workspace…' : (detail?.name ?? 'Workspace')}
            </h1>
            {detail && (
              <Badge variant={statusVariant(detail.subscriptionStatus)}>
                {detail.subscriptionStatus?.replace('_', ' ') ?? 'no subscription'}
              </Badge>
            )}
            {detail?.planKey && <Badge variant="secondary">{detail.planKey}</Badge>}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {detail ? `/${detail.slug} · ${detail.ownerEmail ?? 'unknown owner'}` : ' '}
          </p>
        </div>

        <dl className="flex flex-wrap divide-x divide-border">
          <Stat value={detail ? String(detail.memberCount) : '—'} label="Members" />
          <Stat value={detail ? String(detail.projectCount) : '—'} label="Projects" />
          <Stat value={wsUsage ? formatBytes(wsUsage.totalBytes) : '—'} label="Storage" />
          <Stat value={detail ? formatDate(detail.createdAt) : '—'} label="Created" />
        </dl>
      </div>

      {/* Top-level tabs — workspace-owned resources only; project-owned
          resources (content, media, api keys, webhooks) live in the project
          detail page. */}
      <Tabs
        value={tab}
        onValueChange={(value) => setSearchParams(value ? { tab: value } : {}, { replace: true })}
      >
        <TabsList
          variant="line"
          className="w-full justify-start gap-6 rounded-none border-b border-border p-0"
        >
          {TAB_VALUES.map((t) => (
            <TabsTrigger
              key={t}
              value={t}
              className="flex-none px-1 py-2 text-[13px] group-data-horizontal/tabs:after:bottom-[-1px]"
            >
              {tabLabel(t)}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="projects">
          <div className="pt-6"><ProjectsTab workspaceId={id} /></div>
        </TabsContent>
        <TabsContent value="members">
          <div className="pt-6">
            {detail ? <MembersTab detail={detail} /> : (
              <p className="text-sm text-muted-foreground">Loading members…</p>
            )}
          </div>
        </TabsContent>
        <TabsContent value="plan">
          <div className="pt-6">
            {detail ? <PlanTab workspace={detail} /> : (
              <p className="text-sm text-muted-foreground">Loading plan…</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
