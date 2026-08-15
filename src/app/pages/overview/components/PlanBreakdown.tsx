import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const COLORS = [
  'var(--brand-accent)',
  'var(--text-muted)',
  '#6366f1',
  '#f59e0b',
]

interface PlanBreakdownProps {
  data: Array<{ key: string; name: string; count: number }>
}

export function PlanBreakdown({ data }: PlanBreakdownProps) {
  return (
    <div className="rounded-lg bg-card shadow-[var(--shadow-sm)] p-5">
      <p className="mb-4 text-sm font-medium">Plan Distribution</p>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={70}
            strokeWidth={0}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 6,
              border: '1px solid var(--brand-border)',
              background: 'var(--brand-surface)',
              color: 'var(--text-primary)',
            }}
          />
          <Legend
            formatter={(value) => (
              <span style={{ fontSize: 12 }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
