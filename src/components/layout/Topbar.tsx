import { Moon, Sun, LogOut, Search } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Badge } from '@/components/ui/Badge'
import { useAdminStore } from '@/stores/admin'
import { api, setCsrfToken } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { AdminRole } from '@/lib/types'

const ROLE_VARIANT: Record<AdminRole, 'default' | 'secondary' | 'outline'> = {
  admin: 'default',
  moderator: 'secondary',
  member: 'outline',
}

export function Topbar() {
  const { me, theme, toggleTheme, clear } = useAdminStore()
  const navigate = useNavigate()

  async function handleLogout() {
    try {
      await api.post('/admin/auth/logout')
    } catch {
      // ignore errors — still clear session
    }
    setCsrfToken(null)
    clear()
    navigate('/login', { replace: true })
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-card px-5">
      {/* Search placeholder */}
      <div className="max-w-sm flex-1">
        <button
          className={cn(
            'flex w-full items-center gap-2 rounded-lg border border-input bg-background',
            'px-3 py-1.5 text-sm text-muted-foreground',
            'transition-colors duration-150 hover:border-ring/50',
          )}
        >
          <Search size={14} />
          <span>Search users, workspaces…</span>
          <kbd className="ml-auto rounded border border-border px-1 py-0.5 text-[10px] text-muted-foreground">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right controls */}
      <div className="ml-auto flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className={cn(
            'flex size-8 items-center justify-center rounded-lg',
            'text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground',
          )}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <div className="h-5 w-px bg-border" />

        {/* Admin identity */}
        {me && (
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-end">
              <span className="text-xs font-medium leading-tight text-foreground">{me.name}</span>
              <span className="text-[10px] leading-tight text-muted-foreground">{me.email}</span>
            </div>
            <Badge variant={ROLE_VARIANT[me.role]}>{me.role}</Badge>
            <div className="flex size-7 items-center justify-center rounded-full bg-primary/10">
              <span className="text-xs font-semibold text-primary">
                {me.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        )}

        <div className="h-5 w-px bg-border" />

        {/* Logout */}
        <button
          onClick={handleLogout}
          title="Log out"
          className={cn(
            'flex size-8 items-center justify-center rounded-lg',
            'text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground',
          )}
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  )
}
