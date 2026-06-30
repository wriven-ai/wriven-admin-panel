import { useState } from 'react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface PlatformFlag {
  key: string
  label: string
  description: string
  value: boolean
}

const DEFAULT_FLAGS: PlatformFlag[] = [
  {
    key: 'signups_enabled',
    label: 'User signups',
    description: 'Allow new users to register on the platform.',
    value: true,
  },
  {
    key: 'maintenance_mode',
    label: 'Maintenance mode',
    description: 'Display a maintenance page to all users.',
    value: false,
  },
]

export function SettingsPage() {
  const [flags, setFlags] = useState(DEFAULT_FLAGS)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await Promise.resolve()
      toast.success('Settings saved.')
    } finally {
      setSaving(false)
    }
  }

  function toggle(key: string) {
    setFlags((prev) =>
      prev.map((f) => (f.key === key ? { ...f, value: !f.value } : f)),
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Platform-level configuration flags."
        action={
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        }
      />

      <div className="max-w-2xl space-y-3">
        {flags.map((flag) => (
          <div
            key={flag.key}
            className="flex items-start justify-between gap-4 rounded-lg border bg-card p-4"
          >
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{flag.label}</p>
                <Badge variant={flag.value ? 'success' : 'secondary'}>
                  {flag.value ? 'On' : 'Off'}
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{flag.description}</p>
            </div>
            <button
              role="switch"
              aria-checked={flag.value}
              onClick={() => toggle(flag.key)}
              className={`relative mt-0.5 h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
                flag.value ? 'bg-brand-accent' : 'bg-muted'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  flag.value ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <div className="max-w-2xl rounded-lg border border-dashed bg-card/50 p-4">
        <p className="text-xs text-muted-foreground">
          Additional platform settings (default plan, invite codes, etc.) will appear here once
          exposed by the backend <code className="font-mono">/admin/settings</code> endpoint.
        </p>
      </div>
    </div>
  )
}
