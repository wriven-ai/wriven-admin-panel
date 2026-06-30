import { Moon, Sun, LogOut, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useAdminStore } from '@/stores/admin'
import { cn } from '@/lib/utils'
import type { AdminRole } from '@/lib/types'

const ROLE_VARIANT: Record<AdminRole, 'default' | 'secondary' | 'outline'> = {
  admin: 'default',
  moderator: 'secondary',
  member: 'outline',
}

export function Topbar() {
  const { me, theme, toggleTheme, clear } = useAdminStore()

  return (
    <header className="h-14 flex items-center gap-4 border-b border-border bg-card px-5 shrink-0">
      {/* Search placeholder */}
      <div className="flex-1 max-w-sm">
        <button
          className={cn(
            'flex items-center gap-2 w-full rounded-lg border border-input bg-background',
            'px-3 py-1.5 text-sm text-muted-foreground',
            'hover:border-ring/50 transition-colors duration-150',
          )}
        >
          <Search size={14} />
          <span>Search users, workspaces…</span>
          <kbd className="ml-auto text-[10px] border border-border rounded px-1 py-0.5 text-muted-foreground">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className={cn(
            'size-8 flex items-center justify-center rounded-lg',
            'text-muted-foreground hover:bg-accent hover:text-foreground',
            'transition-colors duration-150',
          )}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Separator */}
        <div className="h-5 w-px bg-border" />

        {/* Admin identity */}
        {me && (
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-end">
              <span className="text-xs font-medium text-foreground leading-tight">
                {me.name}
              </span>
              <span className="text-[10px] text-muted-foreground leading-tight">
                {me.email}
              </span>
            </div>
            <Badge variant={ROLE_VARIANT[me.role]}>{me.role}</Badge>
            <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-semibold text-primary">
                {me.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        )}

        {/* Separator */}
        <div className="h-5 w-px bg-border" />

        {/* Logout */}
        <button
          onClick={clear}
          title="Log out"
          className={cn(
            'size-8 flex items-center justify-center rounded-lg',
            'text-muted-foreground hover:bg-accent hover:text-foreground',
            'transition-colors duration-150',
          )}
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  )
}
