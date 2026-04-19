'use client'

import {
  classifyAnalyticsGap,
  gapBg,
  gapColor,
  gapLabel,
  type AnalyticsDiagnostic,
  type AnalyticsLevelKey,
  type GapClassification,
} from '@/types'
import { ClassificationDonut, GapPriorityBarChart, RadarChart12Areas } from './Charts'

const GROUP_COLORS: Record<AnalyticsLevelKey, string> = {
  strategic: '#6B21A8',
  process: '#1D4ED8',
  support: '#0F766E',
}

function GapBadge({ gap }: { gap: GapClassification }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
      style={{ backgroundColor: gapBg(gap), color: gapColor(gap) }}
    >
      {gapLabel(gap)}
    </span>
  )
}

function PercentageCell({ pct, gap }: { pct: number; gap: GapClassification }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-2.5 w-24 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: gapColor(gap) }} />
      </div>
      <span className="text-sm font-semibold tabular-nums" style={{ color: gapColor(gap) }}>
        {pct.toFixed(1)}%
      </span>
    </div>
  )
}

function SummaryCard({ label, value, detail, gap }: { label: string; value: string; detail: string; gap: GapClassification }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">{label}</p>
      <p className="mt-3 text-4xl font-semibold leading-none" style={{ color: gapColor(gap) }}>
        {value}
      </p>
      <p className="mt-2 text-sm text-gray-500">{detail}</p>
    </div>
  )
}

function TableGroupHeader({ label, level }: { label: string; level: AnalyticsLevelKey }) {
  return (
    <tr>
      <td colSpan={5} className="px-4 py-2.5 text-xs font-bold uppercase tracking-[0.18em] text-white" style={{ backgroundColor: GROUP_COLORS[level] }}>
        {label}
      </td>
    </tr>
  )
}

function AreaRow({
  name,
  score,
  max,
  pct,
  gap,
  onClick,
}: {
  name: string
  score: number
  max: number
  pct: number
  gap: GapClassification
  onClick?: () => void
}) {
  return (
    <tr className={`border-b border-gray-100 ${onClick ? 'cursor-pointer transition hover:bg-gray-50' : ''}`} onClick={onClick}>
      <td className="px-4 py-3 text-sm font-medium text-gray-800">{name}</td>
      <td className="px-4 py-3 text-center text-sm text-gray-500">{max}</td>
      <td className="px-4 py-3 text-center text-sm font-semibold text-gray-900">{score}</td>
      <td className="px-4 py-3"><PercentageCell pct={pct} gap={gap} /></td>
      <td className="px-4 py-3"><GapBadge gap={gap} /></td>
    </tr>
  )
}

export default function OverviewTab({
  diagnostic,
  onNavigateToArea,
}: {
  diagnostic: AnalyticsDiagnostic
  onNavigateToArea: (level: AnalyticsLevelKey, areaKey: string) => void
}) {
  const overview = diagnostic.overview
  const strategicGap = classifyAnalyticsGap(overview.strategicPct)
  const processGap = classifyAnalyticsGap(overview.processPct)
  const supportGap = classifyAnalyticsGap(overview.supportPct)
  const overallGap = classifyAnalyticsGap(overview.overallIndex)

  const strategicAreas = overview.areas.filter((area) => area.level === 'strategic')
  const processAreas = overview.areas.filter((area) => area.level === 'process')
  const supportAreas = overview.areas.filter((area) => area.level === 'support')

  const parameters = [
    ...(diagnostic.strategic?.areas ?? []),
    ...(diagnostic.process?.areas ?? []),
    ...(diagnostic.support?.areas ?? []),
  ].flatMap((area) => area.parameters)

  const distribution: Array<{ gap: GapClassification; value: number }> = [
    { gap: 'high_priority_gap', value: parameters.filter((parameter) => parameter.gap === 'high_priority_gap').length },
    { gap: 'low_priority_gap', value: parameters.filter((parameter) => parameter.gap === 'low_priority_gap').length },
    { gap: 'ideal_performance', value: parameters.filter((parameter) => parameter.gap === 'ideal_performance').length },
  ]

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Overall Lendability Index" value={`${overview.overallIndex.toFixed(1)}%`} detail="Overall Lendability Index" gap={overallGap} />
        <SummaryCard label="Strategic Level %" value={`${overview.strategicPct.toFixed(1)}%`} detail={`${overview.strategicTotal} / ${overview.strategicMax} points`} gap={strategicGap} />
        <SummaryCard label="Process Level %" value={`${overview.processPct.toFixed(1)}%`} detail={`${overview.processTotal} / ${overview.processMax} points`} gap={processGap} />
        <SummaryCard label="Support Level %" value={`${overview.supportPct.toFixed(1)}%`} detail={`${overview.supportTotal} / ${overview.supportMax} points`} gap={supportGap} />
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Diagnosis Result Summary</h2>
          <p className="mt-1 text-sm text-gray-500">Click a capacity area row to jump to its detailed scoring section.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Capacity Area</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Max Points</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Score Achieved</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Percentage (%)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Gap Classification</th>
              </tr>
            </thead>
            <tbody>
              <TableGroupHeader label="Strategic Capacity Level Gaps" level="strategic" />
              {strategicAreas.map((area) => (
                <AreaRow
                  key={String(area.key)}
                  name={area.name}
                  score={area.score}
                  max={area.max}
                  pct={area.pct}
                  gap={area.gap}
                  onClick={() => onNavigateToArea('strategic', String(area.key))}
                />
              ))}
              <AreaRow name="Strategic Total" score={overview.strategicTotal} max={overview.strategicMax} pct={overview.strategicPct} gap={strategicGap} />

              <TableGroupHeader label="Process Capacity Level Gaps" level="process" />
              {processAreas.map((area) => (
                <AreaRow
                  key={String(area.key)}
                  name={area.name}
                  score={area.score}
                  max={area.max}
                  pct={area.pct}
                  gap={area.gap}
                  onClick={() => onNavigateToArea('process', String(area.key))}
                />
              ))}
              <AreaRow name="Process Total" score={overview.processTotal} max={overview.processMax} pct={overview.processPct} gap={processGap} />

              <TableGroupHeader label="Support Capacity Level Gaps" level="support" />
              {supportAreas.map((area) => (
                <AreaRow
                  key={String(area.key)}
                  name={area.name}
                  score={area.score}
                  max={area.max}
                  pct={area.pct}
                  gap={area.gap}
                  onClick={() => onNavigateToArea('support', String(area.key))}
                />
              ))}
              <AreaRow name="Support Total" score={overview.supportTotal} max={overview.supportMax} pct={overview.supportPct} gap={supportGap} />
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">12 Capacity Areas Radar Chart</h3>
        <p className="mt-1 text-sm text-gray-500">Actual performance across all twelve capacity areas against the 80% ideal threshold.</p>
        <div className="mt-6">
          <RadarChart12Areas areas={overview.areas} classification={overview.classification} />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">Gap Priority Ranking</h3>
          <p className="mt-1 text-sm text-gray-500">Areas ordered from most critical (top) to least critical (bottom).</p>
          <div className="mt-6">
            <GapPriorityBarChart areas={overview.areas} />
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">Classification Distribution Donut</h3>
          <p className="mt-1 text-sm text-gray-500">Count of parameters by gap classification.</p>
          <div className="mt-6">
            <ClassificationDonut distribution={distribution} />
          </div>
        </section>
      </div>
    </div>
  )
}
