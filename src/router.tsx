import { createBrowserRouter } from 'react-router'
import { AuthLayout } from '@/app/auth-layout'
import { RequireAdmin } from '@/app/require-admin'
import { RequireRole } from '@/app/require-role'
import { RootLayout } from '@/app/root-layout'
import { OverviewPage } from '@/pages/overview/overview-page'
import { UsersPage } from '@/pages/users/users-page'
import { WorkspacesPage } from '@/pages/workspaces/workspaces-page'
import { ProjectsPage } from '@/pages/projects/projects-page'
import { ContentPage } from '@/pages/content/content-page'
import { MediaPage } from '@/pages/media/media-page'
import { ApiKeysPage } from '@/pages/api-keys/api-keys-page'
import { WebhooksPage } from '@/pages/webhooks/webhooks-page'
import { PlansPage } from '@/pages/plans/plans-page'
import { AdminsPage } from '@/pages/admins/admins-page'
import { AuditPage } from '@/pages/audit/audit-page'
import { SettingsPage } from '@/pages/settings/settings-page'

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
