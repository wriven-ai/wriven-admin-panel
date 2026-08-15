import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { formatDate } from '@/lib/format'

interface GrowthChartProps {
  data: Array<{ date: string; users: number; workspaces: number }>
}

export function GrowthChart({ data }: GrowthChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    label: formatDate(d.date).replace(/,\s*\d{4}$/, ''),
  }))

  return (
    <div className="rounded-lg bg-card shadow-[var(--shadow-sm)] p-5">
      <p className="mb-4 text-sm font-medium">Growth</p>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={formatted} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11 }}
            className="fill-muted-foreground"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            className="fill-muted-foreground"
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 6,
              border: '1px solid var(--brand-border)',
              background: 'var(--brand-surface)',
              color: 'var(--text-primary)',
            }}
          />
          <Line
            type="monotone"
            dataKey="users"
            stroke="var(--brand-accent)"
            strokeWidth={2}
            dot={false}
            name="Users"
          />
          <Line
            type="monotone"
            dataKey="workspaces"
            stroke="var(--text-muted)"
            strokeWidth={2}
            dot={false}
            name="Workspaces"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
