'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { gapColor, gapLabel, type AnalyticsArea, type AnalyticsOverviewArea, type AnalyticsParameter, type GapClassification } from '@/types'

const SHORT_LABELS: Record<string, string> = {
  strategicManagement: 'Strategic Mgmt',
  managementLeadership: 'Mgmt & Leadership',
  businessEnvironment: 'Business Env',
  productionOperations: 'Production & Ops',
  marketingSales: 'Marketing & Sales',
  environmentalManagement: 'Environmental Mgmt',
  organizationalStructure: 'Org Structure',
  finance: 'Finance',
  humanResources: 'Human Resources',
  informationManagement: 'Info Management',
  qualityManagement: 'Quality Mgmt',
  technologicalInnovation: 'Tech Innovation',
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`
}

function asShortLabel(key: string, fallback: string) {
  return SHORT_LABELS[key] ?? fallback.replace(/ Area$/, '')
}

function gapFill(gap: GapClassification | null | undefined) {
  return gap ? gapColor(gap) : '#CBD5E1'
}

function donutLabel(gap: GapClassification) {
  return gapLabel(gap)
}

export function RadarChart12Areas({
  areas,
  classification,
}: {
  areas: AnalyticsOverviewArea[]
  classification: 'investment_ready' | 'conditionally_lendable' | 'high_risk'
}) {
  const fill = classification === 'investment_ready'
    ? '#0F6E56'
    : classification === 'conditionally_lendable'
      ? '#BA7517'
      : '#A32D2D'

  const data = areas.map((area) => ({
    area: asShortLabel(String(area.key), area.name),
    actual: area.pct,
    target: 80,
  }))

  return (
    <ResponsiveContainer width="100%" height={420}>
      <RadarChart data={data} margin={{ top: 20, right: 32, bottom: 20, left: 32 }}>
        <PolarGrid stroke="#D1D5DB" />
        <PolarAngleAxis dataKey="area" tick={{ fontSize: 11, fill: '#4B5563' }} />
        <PolarRadiusAxis domain={[0, 100]} tickCount={6} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
        <Radar name="Actual scores" dataKey="actual" stroke={fill} fill={fill} fillOpacity={0.18} strokeWidth={2} />
        <Radar name="80% target threshold" dataKey="target" stroke="#94A3B8" fill="transparent" strokeDasharray="5 5" strokeWidth={1.5} />
        <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, 'Score']} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </RadarChart>
    </ResponsiveContainer>
  )
}

export function GapPriorityBarChart({ areas }: { areas: AnalyticsOverviewArea[] }) {
  const data = [...areas]
    .sort((left, right) => left.pct - right.pct)
    .map((area) => ({
      name: asShortLabel(String(area.key), area.name),
      pct: area.pct,
      gap: area.gap,
      label: donutLabel(area.gap),
    }))

  return (
    <ResponsiveContainer width="100%" height={Math.max(420, data.length * 34 + 40)}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 50, bottom: 8, left: 120 }}>
        <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tickFormatter={formatPercent} tick={{ fontSize: 11, fill: '#6B7280' }} />
        <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: '#374151' }} />
        <Tooltip formatter={(value: number, _name, payload) => [`${value.toFixed(1)}%`, payload?.payload?.label ?? 'Gap']} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <ReferenceLine x={80} stroke="#94A3B8" strokeDasharray="5 5" label={{ value: '80%', position: 'insideTopRight', fill: '#94A3B8', fontSize: 10 }} />
        <Bar dataKey="pct" name="Score (%)" radius={[0, 6, 6, 0]}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={gapFill(entry.gap)} />
          ))}
          <LabelList dataKey="pct" position="right" formatter={(value: number) => `${value.toFixed(1)}%`} style={{ fontSize: 11, fill: '#374151' }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function ClassificationDonut({
  distribution,
}: {
  distribution: Array<{ gap: GapClassification; value: number }>
}) {
  const data = distribution
    .filter((entry) => entry.value > 0)
    .map((entry) => ({
      name: donutLabel(entry.gap),
      value: entry.value,
      fill: gapFill(entry.gap),
    }))

  const total = distribution.reduce((sum, entry) => sum + entry.value, 0)

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92} paddingAngle={3}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number, name: string) => [value, name]} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold text-gray-900">{total}</span>
        <span className="text-xs text-gray-500">parameters</span>
      </div>
    </div>
  )
}

export function LevelSummaryBarChart({
  areas,
}: {
  areas: Array<{ name: string; score: number; max: number; pct: number; gap: GapClassification }>
}) {
  const maxDomain = Math.max(...areas.map((area) => area.max), 10)
  const data = areas.map((area) => ({
    name: area.name.replace(/ Area$/, ''),
    score: area.score,
    gap: area.gap,
    meta: `${area.score}/${area.max} · ${area.pct.toFixed(1)}%`,
  }))

  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 52)}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 70, bottom: 8, left: 160 }}>
        <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" domain={[0, maxDomain]} tick={{ fontSize: 11, fill: '#6B7280' }} />
        <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 11, fill: '#374151' }} />
        <Tooltip formatter={(value: number, _name, payload) => [`${value} points`, payload?.payload?.meta ?? 'Score']} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <ReferenceLine x={Math.round(maxDomain * 0.8)} stroke="#94A3B8" strokeDasharray="5 5" label={{ value: '80%', position: 'insideTopRight', fill: '#94A3B8', fontSize: 10 }} />
        <Bar dataKey="score" name="Score achieved" radius={[0, 6, 6, 0]}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={gapFill(entry.gap)} />
          ))}
          <LabelList dataKey="meta" position="right" style={{ fontSize: 11, fill: '#374151' }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function AreaParameterBarChart({ parameters }: { parameters: AnalyticsParameter[] }) {
  const data = parameters.map((parameter) => ({
    name: parameter.name.length > 18 ? `${parameter.name.slice(0, 18)}...` : parameter.name,
    fullName: parameter.name,
    score: parameter.score ?? 0,
    gap: parameter.gap,
    pending: parameter.score === null,
  }))

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 16, right: 12, bottom: 56, left: 0 }}>
        <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" angle={-22} textAnchor="end" height={62} interval={0} tick={{ fontSize: 10, fill: '#6B7280' }} />
        <YAxis domain={[0, 10]} tickCount={6} tick={{ fontSize: 11, fill: '#6B7280' }} />
        <Tooltip<any, any>
          labelFormatter={(_label, payload) => payload?.[0]?.payload?.fullName ?? ''}
          formatter={(value: any, _name: any, payload: any) => {
            if (payload?.payload?.pending) return ['Pending', 'Score']
            return [`${value} / 10`, 'Score']
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <ReferenceLine y={8} stroke="#94A3B8" strokeDasharray="5 5" label={{ value: '8', position: 'right', fill: '#94A3B8', fontSize: 10 }} />
        <Bar dataKey="score" name="Parameter score" radius={[6, 6, 0, 0]} maxBarSize={44}>
          {data.map((entry) => (
            <Cell key={entry.fullName} fill={entry.pending ? '#CBD5E1' : gapFill(entry.gap)} />
          ))}
          <LabelList
            dataKey="score"
            position="top"
            content={({ x, y, width, value, index }) => {
              if (typeof index !== 'number') return null
              const item = data[index]
              const label = item.pending ? 'Pending' : `${value}`
              return (
                <text x={Number(x) + Number(width) / 2} y={Number(y) - 6} textAnchor="middle" fontSize={10} fill="#374151">
                  {label}
                </text>
              )
            }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function LevelOverviewChart({
  areas,
}: {
  areas: AnalyticsArea[]
}) {
  const data = areas.map((area) => ({
    name: area.name.replace(/ Area$/, ''),
    pct: area.pct,
    gap: area.gap,
  }))

  return (
    <ResponsiveContainer width="100%" height={Math.max(240, data.length * 44)}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 40, bottom: 8, left: 180 }}>
        <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tickFormatter={formatPercent} tick={{ fontSize: 11, fill: '#6B7280' }} />
        <YAxis type="category" dataKey="name" width={180} tick={{ fontSize: 11, fill: '#374151' }} />
        <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, 'Percentage']} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <ReferenceLine x={80} stroke="#94A3B8" strokeDasharray="5 5" label={{ value: '80%', position: 'insideTopRight', fill: '#94A3B8', fontSize: 10 }} />
        <Bar dataKey="pct" name="Achievement (%)" radius={[0, 6, 6, 0]}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={gapFill(entry.gap)} />
          ))}
          <LabelList dataKey="pct" position="right" formatter={(value: number) => `${value.toFixed(1)}%`} style={{ fontSize: 11, fill: '#374151' }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
