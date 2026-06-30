import { createBrowserRouter } from 'react-router'
import { AuthLayout } from '@/app/layout/AuthLayout'
import { RequireAdmin } from '@/app/RequireAdmin'
import { RequireRole } from '@/app/RequireRole'
import { RootLayout } from '@/app/layout/RootLayout'
import { OverviewPage } from '@/app/pages/overview/OverviewPage'
import { UsersPage } from '@/app/pages/users/UsersPage'
import { WorkspacesPage } from '@/app/pages/workspaces/WorkspacesPage'
import { ProjectsPage } from '@/app/pages/projects/ProjectsPage'
import { ContentPage } from '@/app/pages/content/ContentPage'
import { MediaPage } from '@/app/pages/media/MediaPage'
import { ApiKeysPage } from '@/app/pages/api-keys/ApiKeysPage'
import { WebhooksPage } from '@/app/pages/webhooks/WebhooksPage'
import { PlansPage } from '@/app/pages/plans/PlansPage'
import { AdminsPage } from '@/app/pages/admins/AdminsPage'
import { AuditPage } from '@/app/pages/audit/AuditPage'
import { SettingsPage } from '@/app/pages/settings/SettingsPage'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: (
          <div className="text-sm text-muted-foreground">Login — coming soon.</div>
        ),
      },
    ],
  },
  {
    path: '/',
    element: <RequireAdmin />,
    children: [
      {
        element: <RootLayout />,
        children: [
          { index: true, element: <OverviewPage /> },
          { path: 'users', element: <UsersPage /> },
          { path: 'workspaces', element: <WorkspacesPage /> },
          { path: 'projects', element: <ProjectsPage /> },
          { path: 'content', element: <ContentPage /> },
          { path: 'media', element: <MediaPage /> },
          { path: 'api-keys', element: <ApiKeysPage /> },
          { path: 'webhooks', element: <WebhooksPage /> },
          { path: 'audit', element: <AuditPage /> },
          // Admin-only routes
          {
            element: <RequireRole roles={['admin']} />,
            children: [
              { path: 'plans', element: <PlansPage /> },
              { path: 'admins', element: <AdminsPage /> },
              { path: 'settings', element: <SettingsPage /> },
            ],
          },
        ],
      },
    ],
  },
])
