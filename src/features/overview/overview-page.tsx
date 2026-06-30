import { PageHeader } from '@/components/layout/page-header'

export function OverviewPage() {
  return (
    <div>
      <PageHeader
        title="Overview"
        description="Platform health at a glance."
      />
      <p className="text-sm text-muted-foreground">Dashboard widgets coming soon.</p>
    </div>
  )
}
