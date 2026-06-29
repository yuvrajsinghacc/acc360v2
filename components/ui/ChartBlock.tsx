'use client'

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts'
import { Loader2 } from 'lucide-react'

interface ChartDataPoint {
  name: string
  value: number
}

interface ChartSpec {
  type: 'bar' | 'line'
  title?: string
  data: ChartDataPoint[]
}

const BAR_COLORS = ['#FFA300', '#A7BDB1', '#FECD42', '#7B7C81']

const AXIS_TICK = { fill: '#7B7C81', fontSize: 11 } as const

const TOOLTIP_PROPS = {
  cursor: { fill: '#ffffff08' },
  contentStyle: {
    backgroundColor: '#3a3a3d',
    border: '1px solid #64656A',
    borderRadius: 8,
    fontSize: 12,
    padding: '6px 10px',
  },
  labelStyle: { color: '#DFD5CC', marginBottom: 2 },
  itemStyle: { color: '#FFA300' },
}

function BarView({ spec }: { spec: ChartSpec }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={spec.data} margin={{ top: 4, right: 12, left: -10, bottom: 4 }}>
        <XAxis dataKey="name" tick={AXIS_TICK} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
        <Tooltip {...TOOLTIP_PROPS} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {spec.data.map((_, idx) => (
            <Cell key={idx} fill={BAR_COLORS[idx % BAR_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function LineView({ spec }: { spec: ChartSpec }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={spec.data} margin={{ top: 4, right: 12, left: -10, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#64656A" opacity={0.2} />
        <XAxis dataKey="name" tick={AXIS_TICK} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
        <Tooltip {...TOOLTIP_PROPS} />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#FFA300"
          strokeWidth={2}
          dot={{ fill: '#FFA300', r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5, strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

interface Props {
  content: string
}

export function ChartBlock({ content }: Props) {
  let spec: ChartSpec | null = null
  try {
    const parsed = JSON.parse(content.trim())
    if (parsed?.type && Array.isArray(parsed?.data) && parsed.data.length > 0) {
      spec = parsed as ChartSpec
    }
  } catch {
    // JSON incomplete — still streaming
  }

  if (!spec) {
    return (
      <div className="my-4 rounded-lg border border-border/40 bg-card/10 px-4 py-3 flex items-center gap-2">
        <Loader2 size={12} className="animate-spin shrink-0 text-muted" />
        <span className="text-xs text-muted">Preparing chart…</span>
      </div>
    )
  }

  return (
    <div className="my-4 rounded-lg border border-border bg-card/20 px-4 pt-4 pb-2">
      {spec.title && (
        <p className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-3">
          {spec.title}
        </p>
      )}
      {spec.type === 'bar' && <BarView spec={spec} />}
      {spec.type === 'line' && <LineView spec={spec} />}
    </div>
  )
}
