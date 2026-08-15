import { ArrowLeft, Building2 } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router'
import { PageHeader } from '@/components/layout/PageHeader'
import { ApiKeysTab } from '@/components/admin-tabs/ApiKeysTab'
import { ContentTab } from '@/components/admin-tabs/ContentTab'
import { ContentTypesTab } from '@/components/admin-tabs/ContentTypesTab'
import { MediaTab } from '@/components/admin-tabs/MediaTab'
import { WebhooksTab } from '@/components/admin-tabs/WebhooksTab'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatBytes, formatDate, formatNumber } from '@/lib/format'
import { useProjectDetail, useProjectUsage } from './queries'

const TAB_VALUES = ['details', 'content-types', 'entries', 'media', 'api-keys', 'webhooks'] as const
type TabValue = (typeof TAB_VALUES)[number]

const TAB_LABELS: Record<TabValue, string> = {
  details: 'Details & Usage',
  'content-types': 'Content Types',
  entries: 'Entries',
  media: 'Media',
  'api-keys': 'API Keys',
  webhooks: 'Webhooks',
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border bg-card p-3 text-center">
      <dd className="text-lg font-semibold tabular-nums">{value}</dd>
      <dt className="text-2xs text-muted-foreground">{label}</dt>
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

export function ProjectDetailPage() {
  const { id = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()

  const { data: project, isLoading } = useProjectDetail(id)
  const { data: usage } = useProjectUsage(id)

  const raw = searchParams.get('tab')
  const tab: TabValue = TAB_VALUES.includes(raw as TabValue) ? (raw as TabValue) : 'details'

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link to="/projects">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <p className="text-xs text-muted-foreground">Projects</p>
      </div>

      <PageHeader
        title={isLoading ? 'Project…' : (project?.name ?? 'Project')}
        description={project ? `/${project.slug} · created ${formatDate(project.createdAt)}` : undefined}
      />

      {project && (
        <div className="flex flex-wrap items-center gap-3">
          {project.deleted ? (
            <Badge variant="error">Deleted</Badge>
          ) : (
            <Badge variant="success">Active</Badge>
          )}
          {project.workspaceName && (
            <Link
              to={`/workspaces/${project.workspaceId}`}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <Building2 className="h-3.5 w-3.5" />
              {project.workspaceName}
            </Link>
          )}
        </div>
      )}

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat value={usage ? `${usage.entries.published}/${usage.entries.total}` : '—'} label="Entries (pub/total)" />
        <Stat value={usage ? formatNumber(usage.contentTypes) : '—'} label="Content types" />
        <Stat value={usage ? formatBytes(usage.media.totalBytes) : '—'} label="Storage" />
        <Stat value={usage ? formatNumber(usage.ai.generations) : '—'} label="AI generations" />
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

        <TabsContent value="details">
          <div className="grid gap-4 pt-4 sm:grid-cols-2 lg:grid-cols-3">
            {usage && (
              <>
                <div className="rounded-lg border bg-card p-4">
                  <p className="mb-3 text-sm font-medium">Entries</p>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <UsageRow label="Total" value={formatNumber(usage.entries.total)} />
                    <UsageRow label="Published" value={formatNumber(usage.entries.published)} />
                    <UsageRow label="Draft" value={formatNumber(usage.entries.draft)} />
                    <UsageRow label="Archived" value={formatNumber(usage.entries.archived)} />
                  </ul>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <p className="mb-3 text-sm font-medium">Media</p>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <UsageRow label="Assets" value={formatNumber(usage.media.assetCount)} />
                    <UsageRow label="Storage" value={formatBytes(usage.media.totalBytes)} />
                  </ul>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <p className="mb-3 text-sm font-medium">AI</p>
                  <ul className="space-y-1 text-xs text-muted-foreground">
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
                  </ul>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <p className="mb-3 text-sm font-medium">API keys</p>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <UsageRow label="Total" value={formatNumber(usage.apiKeys.total)} />
                    <UsageRow label="Active" value={formatNumber(usage.apiKeys.active)} />
                  </ul>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <p className="mb-3 text-sm font-medium">Webhooks</p>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <UsageRow label="Total" value={formatNumber(usage.webhooks.total)} />
                    <UsageRow label="Active" value={formatNumber(usage.webhooks.active)} />
                  </ul>
                </div>
              </>
            )}
          </div>
        </TabsContent>
        <TabsContent value="content-types">
          <div className="pt-4"><ContentTypesTab projectId={id} /></div>
        </TabsContent>
        <TabsContent value="entries">
          <div className="pt-4"><ContentTab projectId={id} /></div>
        </TabsContent>
        <TabsContent value="media">
          <div className="pt-4"><MediaTab projectId={id} /></div>
        </TabsContent>
        <TabsContent value="api-keys">
          <div className="pt-4"><ApiKeysTab projectId={id} /></div>
        </TabsContent>
        <TabsContent value="webhooks">
          <div className="pt-4"><WebhooksTab projectId={id} /></div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
