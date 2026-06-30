import { NavLink } from 'react-router'
import {
  LayoutDashboard,
  Users,
  Building2,
  FolderKanban,
  FileText,
  FileImage,
  Key,
  Webhook,
  CreditCard,
  ShieldCheck,
  ClipboardList,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAdminStore } from '@/stores/admin'
import type { AdminRole } from '@/lib/types'

interface NavItem {
  to: string
  label: string
  icon: React.ElementType
  end?: boolean
  adminOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/workspaces', label: 'Workspaces', icon: Building2 },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/content', label: 'Content', icon: FileText },
  { to: '/media', label: 'Media', icon: FileImage },
  { to: '/api-keys', label: 'API Keys', icon: Key },
  { to: '/webhooks', label: 'Webhooks', icon: Webhook },
  { to: '/plans', label: 'Plans', icon: CreditCard, adminOnly: true },
  { to: '/admins', label: 'Admins', icon: ShieldCheck, adminOnly: true },
  { to: '/audit', label: 'Audit Log', icon: ClipboardList },
  { to: '/settings', label: 'Settings', icon: Settings, adminOnly: true },
]

function roleCan(role: AdminRole | undefined, adminOnly: boolean) {
  if (!adminOnly) return true
  return role === 'admin'
}

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, me } = useAdminStore()
  const role = me?.role

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-sidebar border-r border-sidebar-border shrink-0',
        'transition-[width] duration-200 ease-in-out overflow-hidden',
        sidebarCollapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Brand */}
      <div
        className={cn(
          'flex items-center h-14 border-b border-sidebar-border shrink-0 px-4',
          sidebarCollapsed && 'justify-center px-0',
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="size-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground text-xs font-bold leading-none">W</span>
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-sidebar-foreground leading-tight truncate">
                Wriven
              </span>
              <span className="text-[10px] text-muted-foreground leading-tight">Admin Console</span>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-0.5">
        {NAV_ITEMS.filter((item) => roleCan(role, item.adminOnly ?? false)).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            title={sidebarCollapsed ? item.label : undefined}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
                'text-sidebar-foreground transition-colors duration-150',
                'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                isActive && 'bg-sidebar-accent text-sidebar-accent-foreground',
                sidebarCollapsed && 'justify-center px-2',
              )
            }
          >
            <item.icon size={18} className="shrink-0" />
            {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="shrink-0 border-t border-sidebar-border p-2">
        <button
          onClick={toggleSidebar}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm font-medium',
            'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            'transition-colors duration-150',
            sidebarCollapsed && 'justify-center px-2',
          )}
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen size={18} className="shrink-0" />
          ) : (
            <>
              <PanelLeftClose size={18} className="shrink-0" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
