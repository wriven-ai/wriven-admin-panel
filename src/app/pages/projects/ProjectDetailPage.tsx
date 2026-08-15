import { ArrowLeft, Building2 } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router'
import { ApiKeysTab } from '@/components/admin-tabs/ApiKeysTab'
import { ContentTab } from '@/components/admin-tabs/ContentTab'
import { ContentTypesTab } from '@/components/admin-tabs/ContentTypesTab'
import { MediaTab } from '@/components/admin-tabs/MediaTab'
import { WebhooksTab } from '@/components/admin-tabs/WebhooksTab'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatBytes, formatDate, formatNumber } from '@/lib/format'
import { useProjectDetail, useProjectUsage } from './queries'

const TAB_LABELS = {
  'content-types': 'Content Types',
  content: 'Content',
  media: 'Media',
  'api-keys': 'API Keys',
  webhooks: 'Webhooks',
  usage: 'Usage',
} as const
const TAB_VALUES = Object.keys(TAB_LABELS) as (keyof typeof TAB_LABELS)[]
type TabValue = (typeof TAB_VALUES)[number]

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-5 first:pl-0 last:pr-0">
      <dd className="text-lg font-semibold tabular-nums text-foreground">{value}</dd>
      <dt className="text-2xs uppercase tracking-wide text-muted-foreground">{label}</dt>
    </div>
  )
}

function UsageRow({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex justify-between">
      <span className="capitalize">{label}</span>
      <span className="tabular-nums">{value}</span>
    </li>
  )
}

function UsageCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-card shadow-[var(--shadow-sm)] p-4">
      <p className="mb-3 text-sm font-medium">{title}</p>
      <ul className="space-y-1 text-xs text-muted-foreground">{children}</ul>
    </div>
  )
}

export function ProjectDetailPage() {
  const { id = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()

  const { data: project, isLoading } = useProjectDetail(id)
  const { data: usage } = useProjectUsage(id)

  const raw = searchParams.get('tab')
  const tab: TabValue = TAB_VALUES.includes(raw as TabValue) ? (raw as TabValue) : 'content-types'

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <Link
        to="/projects"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Projects
      </Link>

      {/* Title row with inline stats on the right */}
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {isLoading ? 'Project…' : (project?.name ?? 'Project')}
            </h1>
            {project &&
              (project.deleted ? (
                <Badge variant="error">Deleted</Badge>
              ) : (
                <Badge variant="success">Active</Badge>
              ))}
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            {project && `/${project.slug} · created ${formatDate(project.createdAt)}`}
            {project?.workspaceName && (
              <>
                <span>·</span>
                <Link
                  to={`/workspaces/${project.workspaceId}`}
                  className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
                >
                  <Building2 className="h-3.5 w-3.5" />
                  {project.workspaceName}
                </Link>
              </>
            )}
          </p>
        </div>

        <dl className="flex flex-wrap divide-x divide-border">
          <Stat
            value={usage ? `${usage.entries.published}/${usage.entries.total}` : '—'}
            label="Entries (pub/total)"
          />
          <Stat value={usage ? formatNumber(usage.contentTypes) : '—'} label="Content types" />
          <Stat value={usage ? formatBytes(usage.media.totalBytes) : '—'} label="Storage" />
          <Stat value={usage ? formatNumber(usage.ai.generations) : '—'} label="AI generations" />
        </dl>
      </div>

      {/* Top-level tabs */}
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
              {TAB_LABELS[t]}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="content-types">
          <div className="pt-6"><ContentTypesTab projectId={id} /></div>
        </TabsContent>
        <TabsContent value="content">
          <div className="pt-6"><ContentTab projectId={id} /></div>
        </TabsContent>
        <TabsContent value="media">
          <div className="pt-6"><MediaTab projectId={id} /></div>
        </TabsContent>
        <TabsContent value="api-keys">
          <div className="pt-6"><ApiKeysTab projectId={id} /></div>
        </TabsContent>
        <TabsContent value="webhooks">
          <div className="pt-6"><WebhooksTab projectId={id} /></div>
        </TabsContent>
        <TabsContent value="usage">
          <div className="grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-3">
            {usage && (
              <>
                <UsageCard title="Entries">
                  <UsageRow label="Total" value={formatNumber(usage.entries.total)} />
                  <UsageRow label="Published" value={formatNumber(usage.entries.published)} />
                  <UsageRow label="Draft" value={formatNumber(usage.entries.draft)} />
                  <UsageRow label="Archived" value={formatNumber(usage.entries.archived)} />
                </UsageCard>
                <UsageCard title="Media">
                  <UsageRow label="Assets" value={formatNumber(usage.media.assetCount)} />
                  <UsageRow label="Storage" value={formatBytes(usage.media.totalBytes)} />
                </UsageCard>
                <UsageCard title="AI">
                  <UsageRow label="Generations" value={formatNumber(usage.ai.generations)} />
                  <UsageRow label="Succeeded" value={formatNumber(usage.ai.succeeded)} />
                  <UsageRow label="Failed" value={formatNumber(usage.ai.failed)} />
                  <UsageRow label="Tokens" value={formatNumber(usage.ai.totalTokens)} />
                  <UsageRow
                    label="Spend"
                    value={
                      usage.ai.costMicrousd != null
                        ? `$${(usage.ai.costMicrousd / 1_000_000).toFixed(2)}`
                        : '—'
                    }
                  />
                </UsageCard>
                <UsageCard title="API keys">
                  <UsageRow label="Total" value={formatNumber(usage.apiKeys.total)} />
                  <UsageRow label="Active" value={formatNumber(usage.apiKeys.active)} />
                </UsageCard>
                <UsageCard title="Webhooks">
                  <UsageRow label="Total" value={formatNumber(usage.webhooks.total)} />
                  <UsageRow label="Active" value={formatNumber(usage.webhooks.active)} />
                </UsageCard>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
