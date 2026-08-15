import { Search, X } from 'lucide-react'
import { useRef } from 'react'
import { cn } from '@/lib/utils'

interface FilterBarProps {
  /** Omit when the endpoint has no search param — renders selects only. */
  value?: string
  onChange?: (val: string) => void
  placeholder?: string
  children?: React.ReactNode
  className?: string
}

export function FilterBar({
  value = '',
  onChange,
  placeholder = 'Search…',
  children,
  className,
}: FilterBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {onChange && (
        <div className="relative flex-1 min-w-48">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-8 text-sm outline-none ring-ring placeholder:text-muted-foreground focus:ring-1"
          />
          {value && (
            <button
              onClick={() => { onChange(''); inputRef.current?.focus() }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
      {children}
    </div>
  )
}
