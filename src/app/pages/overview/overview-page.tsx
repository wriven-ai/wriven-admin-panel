import { Users, Building2, FolderOpen, FileText, HardDrive, CheckCircle } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { formatBytes, formatNumber } from '@/lib/format'
import { useOverviewMetrics } from './queries'
import { StatCard } from './components/stat-card'
import { GrowthChart } from './components/growth-chart'
import { PlanBreakdown } from './components/plan-breakdown'
import { RecentAudit } from './components/recent-audit'
import { FailingWebhooks } from './components/failing-webhooks'

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-lg border bg-muted" />
      ))}
    </div>
  )
}

export function OverviewPage() {
  const { data, isLoading, error } = useOverviewMetrics()

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
              value={formatNumber(data.totals.users)}
              icon={Users}
            />
            <StatCard
              title="Workspaces"
              value={formatNumber(data.totals.workspaces)}
              icon={Building2}
            />
            <StatCard
              title="Projects"
              value={formatNumber(data.totals.projects)}
              icon={FolderOpen}
            />
            <StatCard
              title="Entries"
              value={formatNumber(data.totals.entries)}
              icon={FileText}
            />
            <StatCard
              title="Storage"
              value={formatBytes(data.totals.storageBytes)}
              icon={HardDrive}
            />
            <StatCard
              title="Active Plans"
              value={formatNumber(data.totals.activePlans)}
              icon={CheckCircle}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <GrowthChart data={data.growth} />
            <PlanBreakdown data={data.planBreakdown} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <RecentAudit events={data.recentAudit} />
            <FailingWebhooks webhooks={data.failingWebhooks} />
          </div>
        </>
      )}
    </div>
  )
}
