import { Users, Building2, FolderOpen, FileText, HardDrive, BarChart2, LifeBuoy } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatBytes, formatNumber } from '@/lib/format'
import { useOverviewMetrics } from './queries'
import { useSupportMetrics } from '../support/queries'
import { StatCard } from './components/StatCard'
import { PlanBreakdown } from './components/PlanBreakdown'

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
      ))}
    </div>
  )
}

export function OverviewPage() {
  const { data, isLoading, error } = useOverviewMetrics()
  const { data: supportMetrics } = useSupportMetrics()

  return (
    <div className="space-y-6">
      <PageHeader title="Overview" description="Platform health at a glance." />

      {isLoading && <StatsSkeleton />}

      {error && (
        <p className="text-sm text-destructive">
          Failed to load metrics — {(error as Error).message}
        </p>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard
              title="Users"
              value={formatNumber(data.users.total)}
              icon={Users}
              description={`${formatNumber(data.users.verified)} verified`}
            />
            <StatCard
              title="Workspaces"
              value={formatNumber(data.workspaces.total)}
              icon={Building2}
            />
            <StatCard
              title="Projects"
              value={formatNumber(data.projects.total)}
              icon={FolderOpen}
            />
            <StatCard
              title="Entries"
              value={formatNumber(data.content.entries)}
              icon={FileText}
              description={`${formatNumber(data.content.published)} published`}
            />
            <StatCard
              title="Storage"
              value={formatBytes(data.media.totalBytes)}
              icon={HardDrive}
            />
            <StatCard
              title="Plan types"
              value={data.plans.length}
              icon={BarChart2}
            />
            {supportMetrics !== undefined && (
              <StatCard
                title="Open tickets"
                value={formatNumber(supportMetrics.open)}
                icon={LifeBuoy}
                description={`${formatNumber(supportMetrics.unassigned)} unassigned`}
              />
            )}
          </div>

          {data.plans.length > 0 && (
            <div className="max-w-md">
              <PlanBreakdown data={data.plans} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
