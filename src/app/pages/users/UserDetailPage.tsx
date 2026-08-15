import { ArrowLeft } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDate } from '@/lib/format'
import { useUserDetail } from './queries'
import { DetailsTab } from './components/tabs/DetailsTab'
import { WorkspacesTab } from './components/tabs/WorkspacesTab'
import { ProjectsTab } from './components/tabs/ProjectsTab'

const TAB_LABELS = {
  details: 'Details',
  workspaces: 'Workspaces',
  projects: 'Projects',
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

export function UserDetailPage() {
  const { id = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()

  const { data: detail, isLoading } = useUserDetail(id)

  const raw = searchParams.get('tab')
  const tab: TabValue = TAB_VALUES.includes(raw as TabValue) ? (raw as TabValue) : 'details'

  const tabLabel = (t: TabValue) => {
    const count =
      t === 'workspaces'
        ? detail?.workspaces.length
        : t === 'projects'
          ? detail?.projects.length
          : undefined
    return count != null ? `${TAB_LABELS[t]} · ${count}` : TAB_LABELS[t]
  }

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <Link
        to="/users"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Users
      </Link>

      {/* Title row with inline stats on the right */}
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {isLoading ? 'User…' : (detail?.name || detail?.email || 'User')}
            </h1>
            {detail && (
              <>
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
              </>
            )}
          </div>
          {detail?.email && (
            <p className="mt-1 text-xs text-muted-foreground">{detail.email}</p>
          )}
        </div>

        <dl className="flex flex-wrap divide-x divide-border">
          <Stat value={detail ? String(detail.workspaces.length) : '—'} label="Workspaces" />
          <Stat value={detail ? String(detail.projects.length) : '—'} label="Projects" />
          <Stat value={detail ? formatDate(detail.createdAt) : '—'} label="Joined" />
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
              {tabLabel(t)}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="details">
          <div className="pt-6">{detail && <DetailsTab detail={detail} />}</div>
        </TabsContent>
        <TabsContent value="workspaces">
          <div className="pt-6">{detail && <WorkspacesTab workspaces={detail.workspaces} />}</div>
        </TabsContent>
        <TabsContent value="projects">
          <div className="pt-6">{detail && <ProjectsTab projects={detail.projects} />}</div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
