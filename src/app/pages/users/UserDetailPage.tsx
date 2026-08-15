import { ArrowLeft } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDate } from '@/lib/format'
import { useUserDetail } from './queries'
import { DetailsTab } from './components/tabs/DetailsTab'
import { WorkspacesTab } from './components/tabs/WorkspacesTab'
import { ProjectsTab } from './components/tabs/ProjectsTab'

const TAB_VALUES = ['details', 'workspaces', 'projects'] as const
type TabValue = (typeof TAB_VALUES)[number]

const TAB_LABELS: Record<TabValue, string> = {
  details: 'Details',
  workspaces: 'Workspaces',
  projects: 'Projects',
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border bg-card p-3 text-center">
      <dd className="text-lg font-semibold tabular-nums">{value}</dd>
      <dt className="text-2xs text-muted-foreground">{label}</dt>
    </div>
  )
}

export function UserDetailPage() {
  const { id = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()

  const { data: detail, isLoading } = useUserDetail(id)

  const raw = searchParams.get('tab')
  const tab: TabValue = TAB_VALUES.includes(raw as TabValue) ? (raw as TabValue) : 'details'

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link to="/users">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <p className="text-xs text-muted-foreground">Users</p>
      </div>

      <PageHeader
        title={isLoading ? 'User…' : (detail?.name || detail?.email || 'User')}
        description={detail?.email}
      />

      {detail && (
        <div className="flex flex-wrap items-center gap-2">
          {detail.suspended ? (
            <Badge variant="error">Suspended</Badge>
          ) : (
            <Badge variant="success">Active</Badge>
          )}
          {detail.emailVerified ? (
            <Badge variant="success">Verified</Badge>
          ) : (
            <Badge variant="warning">Unverified</Badge>
          )}
          <Badge variant="outline" className="capitalize">{detail.provider}</Badge>
        </div>
      )}

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat value={detail ? String(detail.workspaces.length) : '—'} label="Workspaces" />
        <Stat value={detail ? String(detail.projects.length) : '—'} label="Projects" />
        <Stat value={detail ? formatDate(detail.createdAt) : '—'} label="Joined" />
        <Stat value={detail ? String(detail.workspaceCount) : '—'} label="Workspace count" />
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
          <div className="pt-4">{detail && <DetailsTab detail={detail} />}</div>
        </TabsContent>
        <TabsContent value="workspaces">
          <div className="pt-4">{detail && <WorkspacesTab workspaces={detail.workspaces} />}</div>
        </TabsContent>
        <TabsContent value="projects">
          <div className="pt-4">{detail && <ProjectsTab projects={detail.projects} />}</div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
