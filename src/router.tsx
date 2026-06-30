import { createBrowserRouter } from 'react-router'
import { AuthLayout } from '@/app/auth-layout'
import { RequireAdmin } from '@/app/require-admin'
import { RequireRole } from '@/app/require-role'
import { RootLayout } from '@/app/root-layout'
import { OverviewPage } from '@/features/overview/overview-page'
import { UsersPage } from '@/features/users/users-page'
import { WorkspacesPage } from '@/features/workspaces/workspaces-page'
import { ProjectsPage } from '@/features/projects/projects-page'
import { ContentPage } from '@/features/content/content-page'
import { MediaPage } from '@/features/media/media-page'
import { ApiKeysPage } from '@/features/api-keys/api-keys-page'
import { WebhooksPage } from '@/features/webhooks/webhooks-page'
import { PlansPage } from '@/features/plans/plans-page'
import { AdminsPage } from '@/features/admins/admins-page'
import { AuditPage } from '@/features/audit/audit-page'
import { SettingsPage } from '@/features/settings/settings-page'

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
