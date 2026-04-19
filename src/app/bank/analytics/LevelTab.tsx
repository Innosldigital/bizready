'use client'

import { useEffect, useRef, useState } from 'react'
import {
  gapBg,
  gapColor,
  gapLabel,
  type AnalyticsArea,
  type AnalyticsLevelData,
  type AnalyticsLevelKey,
  type AnalyticsParameter,
  type GapClassification,
} from '@/types'
import { AreaParameterBarChart, LevelOverviewChart, LevelSummaryBarChart } from './Charts'

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

function ParameterRow({ parameter, shaded }: { parameter: AnalyticsParameter; shaded: boolean }) {
  const [open, setOpen] = useState(false)
  const backgroundClass = shaded ? 'bg-gray-50' : 'bg-white'

  return (
    <tr className={`${backgroundClass} border-b border-gray-100 align-top`}>
      <td className="px-4 py-3 text-sm font-medium text-gray-800">
        <button type="button" onClick={() => setOpen((value) => !value)} className="flex items-start gap-2 text-left">
          <span className={`mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-200 text-[11px] text-gray-500 transition ${open ? 'rotate-90' : ''}`}>
            &gt;
          </span>
          <span>{parameter.name}</span>
        </button>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        <button type="button" onClick={() => setOpen((value) => !value)} className="text-sm font-medium text-gray-500 underline decoration-dotted underline-offset-4">
          {open ? 'Hide aspects' : `Show ${parameter.aspects.length} aspect${parameter.aspects.length === 1 ? '' : 's'}`}
        </button>
        {open && (
          <ul className="mt-3 space-y-1.5 pl-4 text-xs text-gray-600">
            {parameter.aspects.map((aspect) => (
              <li key={aspect} className="list-disc">{aspect}</li>
            ))}
          </ul>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-gray-700">
        {parameter.score === null ? (
          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Pending</span>
        ) : (
          <div className="space-y-2">
            <p className="font-semibold text-gray-900">{parameter.score} / {parameter.max}</p>
            <div className="flex items-center gap-3">
              <div className="h-2.5 w-24 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full" style={{ width: `${(parameter.score / parameter.max) * 100}%`, backgroundColor: gapColor(parameter.gap as GapClassification) }} />
              </div>
              <span className="text-xs font-semibold tabular-nums" style={{ color: gapColor(parameter.gap as GapClassification) }}>
                {parameter.pct?.toFixed(0)}%
              </span>
            </div>
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        {parameter.gap ? <GapBadge gap={parameter.gap} /> : <span className="text-sm text-gray-400">Pending</span>}
      </td>
    </tr>
  )
}

function AreaSection({ area }: { area: AnalyticsArea }) {
  return (
    <section id={`area-${String(area.key)}`} className="scroll-mt-40 rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-t-2xl border-b border-gray-200 px-5 py-4" style={{ backgroundColor: gapBg(area.gap) }}>
        <h3 className="text-lg font-semibold" style={{ color: gapColor(area.gap) }}>{area.name}</h3>
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700">
          <span>
            Score: <strong style={{ color: gapColor(area.gap) }}>{area.score} / {area.max} · {area.pct.toFixed(1)}%</strong>
          </span>
          <GapBadge gap={area.gap} />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Parameter</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Specific Aspects to Measure</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Score (0-10)</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Gap Classification</th>
            </tr>
          </thead>
          <tbody>
            {area.parameters.map((parameter, index) => (
              <ParameterRow key={parameter.id} parameter={parameter} shaded={index % 2 === 1} />
            ))}
            <tr className="bg-white">
              <td className="px-4 py-3 text-sm font-semibold text-gray-900">Total</td>
              <td className="px-4 py-3 text-sm text-gray-500">{area.parameters.length} parameters</td>
              <td className="px-4 py-3 text-sm text-gray-900">
                <div className="space-y-2">
                  <p className="font-semibold">{area.score} / {area.max}</p>
                  <div className="flex items-center gap-3">
                    <div className="h-2.5 w-24 overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full" style={{ width: `${area.pct}%`, backgroundColor: gapColor(area.gap) }} />
                    </div>
                    <span className="text-xs font-semibold tabular-nums" style={{ color: gapColor(area.gap) }}>{area.pct.toFixed(1)}%</span>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3"><GapBadge gap={area.gap} /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}

function AssessorComment({
  initialValue,
  onSave,
}: {
  initialValue: string
  onSave: (value: string) => Promise<void>
}) {
  const [value, setValue] = useState(initialValue)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setValue(initialValue)
    setStatus('idle')
  }, [initialValue])

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  async function scheduleSave(nextValue: string) {
    setValue(nextValue)
    setStatus('idle')

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      try {
        setStatus('saving')
        await onSave(nextValue)
        setStatus('saved')
      } catch {
        setStatus('error')
      }
    }, 800)
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Assessor&apos;s Comment</h3>
          <p className="mt-1 text-sm text-gray-500">Notes are auto-saved shortly after you stop typing.</p>
        </div>
        <span className={`text-sm font-medium ${status === 'saved' ? 'text-emerald-600' : status === 'saving' ? 'text-gray-500' : status === 'error' ? 'text-red-600' : 'text-gray-400'}`}>
          {status === 'saved' ? 'Saved' : status === 'saving' ? 'Saving...' : status === 'error' ? 'Save failed' : 'Idle'}
        </span>
      </div>
      <textarea
        value={value}
        onChange={(event) => void scheduleSave(event.target.value)}
        rows={5}
        placeholder="Add your assessment notes and observations here."
        className="mt-4 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]"
      />
    </section>
  )
}

function chartGridClass(areaCount: number) {
  if (areaCount >= 5) return 'grid gap-4 md:grid-cols-2 xl:grid-cols-3'
  if (areaCount === 4) return 'grid gap-4 md:grid-cols-2 xl:grid-cols-2'
  return 'grid gap-4 md:grid-cols-2 xl:grid-cols-3'
}

function overviewTitle(levelKey: AnalyticsLevelKey) {
  return levelKey === 'strategic'
    ? 'Strategic Level Overview'
    : levelKey === 'process'
      ? 'Process Level Overview'
      : 'Support Level Overview'
}

export default function LevelTab({
  levelKey,
  title,
  data,
  assessorComment,
  onSaveComment,
}: {
  levelKey: AnalyticsLevelKey
  title: string
  data: AnalyticsLevelData
  assessorComment: string
  onSaveComment: (comment: string) => Promise<void>
}) {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
        <p className="mt-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
          Score range 0-10 per parameter: <span className="font-semibold text-red-800">0-4 = High Priority Gap</span>, <span className="font-semibold text-amber-800">5-7 = Low Priority Gap</span>, <span className="font-semibold text-green-800">8-10 = Ideal Performance</span>
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-base font-semibold text-gray-900">
          <span>{data.total} / {data.max} points</span>
          <span style={{ color: gapColor(data.gap) }}>{data.pct.toFixed(1)}%</span>
          <GapBadge gap={data.gap} />
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">Capacity Areas Overview</h3>
        <p className="mt-1 text-sm text-gray-500">Score achieved in each area, labelled with raw score and percentage achievement.</p>
        <div className="mt-6">
          <LevelSummaryBarChart areas={data.areas.map((area) => ({ name: area.name, score: area.score, max: area.max, pct: area.pct, gap: area.gap }))} />
        </div>
      </section>

      <div className="space-y-5">
        {data.areas.map((area) => (
          <AreaSection key={String(area.key)} area={area} />
        ))}
      </div>

      <section className="rounded-2xl border border-gray-200 p-5 shadow-sm" style={{ backgroundColor: gapBg(data.gap) }}>
        <p className="text-lg font-semibold" style={{ color: gapColor(data.gap) }}>
          {title.replace(/^\d+\.\s*/, '')} Total Score: {data.total} / {data.max} · {data.pct.toFixed(1)}% · {gapLabel(data.gap)}
        </p>
      </section>

      <AssessorComment initialValue={assessorComment} onSave={onSaveComment} />

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">Parameter Score Charts</h3>
        <p className="mt-1 text-sm text-gray-500">Each chart shows parameter-level scoring out of 10, with the 8-point threshold marked.</p>
        <div className={`mt-6 ${chartGridClass(data.areas.length)}`}>
          {data.areas.map((area) => (
            <article key={`${String(area.key)}-chart`} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <h4 className="text-sm font-semibold text-gray-900">{area.name} - Parameter Scores</h4>
              <div className="mt-4">
                <AreaParameterBarChart parameters={area.parameters} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">{overviewTitle(levelKey)}</h3>
        <p className="mt-1 text-sm text-gray-500">Percentage achievement across all areas in this capacity level.</p>
        <div className="mt-6">
          <LevelOverviewChart areas={data.areas} />
        </div>
      </section>
    </div>
  )
}
