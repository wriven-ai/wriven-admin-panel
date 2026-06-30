import { createBrowserRouter } from 'react-router'
import { AuthLayout } from '@/app/auth-layout'
import { RequireAdmin } from '@/app/require-admin'
import { RequireRole } from '@/app/require-role'
import { RootLayout } from '@/app/root-layout'
import { OverviewPage } from '@/app/pages/overview/overview-page'
import { UsersPage } from '@/app/pages/users/users-page'
import { WorkspacesPage } from '@/app/pages/workspaces/workspaces-page'
import { ProjectsPage } from '@/app/pages/projects/projects-page'
import { ContentPage } from '@/app/pages/content/content-page'
import { MediaPage } from '@/app/pages/media/media-page'
import { ApiKeysPage } from '@/app/pages/api-keys/api-keys-page'
import { WebhooksPage } from '@/app/pages/webhooks/webhooks-page'
import { PlansPage } from '@/app/pages/plans/plans-page'
import { AdminsPage } from '@/app/pages/admins/admins-page'
import { AuditPage } from '@/app/pages/audit/audit-page'
import { SettingsPage } from '@/app/pages/settings/settings-page'

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
