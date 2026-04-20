'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import LevelTab from './LevelTab'
import OverviewTab from './OverviewTab'
import type {
  AnalyticsBusinessSummary,
  AnalyticsLevelKey,
  AnalyticsTabKey,
  BankAnalyticsPayload,
} from '@/types'

function formatDateLabel(value?: string | null) {
  if (!value) return 'No diagnosis in selected range'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'No diagnosis in selected range'
  return parsed.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

// Returns "16 Apr 2026" from "2026-04-16"
function formatFullDate(value: string) {
  if (!value) return ''
  const [y, m, d] = value.split('-')
  if (!y || !m) return value
  if (!d) return `${MONTH_LABELS[parseInt(m) - 1]} ${y}`
  return `${parseInt(d)} ${MONTH_LABELS[parseInt(m) - 1]} ${y}`
}

function DiagnosticDatePicker({
  value,
  onChange,
  highlightMonths,
  highlightDates,
  label,
}: {
  value: string           // YYYY-MM-DD or YYYY-MM
  onChange: (v: string) => void
  highlightMonths: Set<string>  // YYYY-MM keys with diagnostics
  highlightDates: Set<string>   // YYYY-MM-DD keys with diagnostics
  label: string
}) {
  const now = new Date()
  const initYear = value ? parseInt(value.slice(0, 4)) : now.getFullYear()
  const [open, setOpen] = useState(false)
  // Start at most recent year with data, or current year
  const [year, setYear] = useState(() => {
    if (highlightMonths.size > 0) {
      return parseInt(Array.from(highlightMonths).sort().at(-1)!.slice(0, 4))
    }
    return initYear || now.getFullYear()
  })
  const [drillMonth, setDrillMonth] = useState<number | null>(null) // 1-12 when in day view
  const ref = useRef<HTMLDivElement>(null)

  // When highlightMonths loads, jump to the latest year with data
  useEffect(() => {
    if (highlightMonths.size > 0) {
      const latestYear = parseInt(Array.from(highlightMonths).sort().at(-1)!.slice(0, 4))
      setYear(latestYear)
    }
  }, [highlightMonths])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) { setOpen(false); setDrillMonth(null) }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const selYear = value ? parseInt(value.slice(0, 4)) : 0
  const selMonth = value ? parseInt(value.slice(5, 7)) : 0
  const selDay = value && value.length >= 10 ? parseInt(value.slice(8, 10)) : 0

  function pickMonth(month: number) {
    setDrillMonth(month)
  }

  function pickDay(day: number) {
    const m = String(drillMonth!).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    onChange(`${year}-${m}-${d}`)
    setOpen(false)
    setDrillMonth(null)
  }

  // Build day grid for drillMonth
  function buildDayGrid(y: number, m: number) {
    const firstDay = new Date(y, m - 1, 1).getDay()
    const daysInMonth = new Date(y, m, 0).getDate()
    const cells: (number | null)[] = Array(firstDay).fill(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }

  const displayLabel = value ? formatFullDate(value) : label

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setDrillMonth(null) }}
        className="flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left text-sm text-gray-700 shadow-sm transition hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
      >
        <span className="font-medium">{displayLabel}</span>
        <span className={`ml-3 text-gray-400 text-xs transition ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {open && (
        <div className="absolute z-40 mt-2 w-72 rounded-2xl border border-gray-200 bg-white p-4 shadow-xl">

          {/* ── DAY VIEW ── */}
          {drillMonth !== null ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <button type="button" onClick={() => setDrillMonth(null)}
                  className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1">
                  ‹ {MONTH_LABELS[drillMonth - 1]} {year}
                </button>
                <span className="text-sm font-semibold text-gray-900">
                  {MONTH_LABELS[drillMonth - 1]} {year}
                </span>
                <div className="w-16" />
              </div>

              {/* Day-of-week headers */}
              <div className="grid grid-cols-7 mb-1">
                {DAY_NAMES.map(d => (
                  <div key={d} className="text-center text-[10px] font-medium text-gray-400 py-1">{d}</div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-0.5">
                {buildDayGrid(year, drillMonth).map((day, i) => {
                  if (!day) return <div key={i} />
                  const dateKey = `${year}-${String(drillMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  const hasData = highlightDates.has(dateKey)
                  const isSelected = selYear === year && selMonth === drillMonth && selDay === day
                  const isFuture = new Date(year, drillMonth - 1, day) > now

                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={isFuture}
                      onClick={() => pickDay(day)}
                      className="relative w-full aspect-square flex items-center justify-center rounded-lg text-xs font-medium transition focus:outline-none"
                      style={{
                        background: isSelected ? 'var(--brand-primary)'
                          : hasData ? 'color-mix(in srgb, var(--brand-primary) 18%, white)'
                          : 'transparent',
                        color: isSelected ? '#fff'
                          : isFuture ? '#d1d5db'
                          : hasData ? 'var(--brand-primary)'
                          : '#374151',
                        fontWeight: hasData ? 700 : 400,
                        cursor: isFuture ? 'not-allowed' : 'pointer',
                        border: hasData && !isSelected
                          ? '1.5px solid color-mix(in srgb, var(--brand-primary) 35%, white)'
                          : '1.5px solid transparent',
                      }}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>

              {highlightDates.size > 0 && (
                <p className="mt-3 text-[10px] text-center text-gray-400">
                  Highlighted days have diagnostics
                </p>
              )}
            </>
          ) : (

          /* ── MONTH VIEW ── */
          <>
            <div className="flex items-center justify-between mb-3">
              <button type="button" onClick={() => setYear(y => y - 1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition text-sm">‹</button>
              <span className="text-sm font-semibold text-gray-900">{year}</span>
              <button type="button" onClick={() => setYear(y => y + 1)}
                disabled={year >= now.getFullYear()}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition text-sm disabled:opacity-30">›</button>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {MONTH_LABELS.map((name, i) => {
                const monthNum = i + 1
                const key = `${year}-${String(monthNum).padStart(2, '0')}`
                const hasData = highlightMonths.has(key)
                const isSelected = selYear === year && selMonth === monthNum
                const isFuture = year > now.getFullYear() || (year === now.getFullYear() && monthNum > now.getMonth() + 1)

                return (
                  <button
                    key={name}
                    type="button"
                    disabled={isFuture}
                    onClick={() => pickMonth(monthNum)}
                    className="relative rounded-xl py-2 text-xs font-medium transition focus:outline-none"
                    style={{
                      background: isSelected ? 'var(--brand-primary)'
                        : hasData ? 'color-mix(in srgb, var(--brand-primary) 15%, white)'
                        : 'transparent',
                      color: isSelected ? '#fff' : isFuture ? '#d1d5db' : hasData ? 'var(--brand-primary)' : '#374151',
                      border: hasData && !isSelected
                        ? '1.5px solid color-mix(in srgb, var(--brand-primary) 40%, white)'
                        : '1.5px solid transparent',
                      cursor: isFuture ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {name}
                    {hasData && !isSelected && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                        style={{ background: 'var(--brand-primary)' }} />
                    )}
                  </button>
                )
              })}
            </div>

            {highlightMonths.size > 0 && (
              <p className="mt-3 text-[10px] text-center text-gray-400">
                Click a month to see diagnostic days
              </p>
            )}
          </>
          )}
        </div>
      )}
    </div>
  )
}

function BusinessSelect({
  businesses,
  value,
  onChange,
}: {
  businesses: AnalyticsBusinessSummary[]
  value: string
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const selected = businesses.find((business) => business.id === value) ?? businesses[0]
  const filteredBusinesses = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return businesses
    return businesses.filter((business) => {
      return `${business.name} ${business.sector} ${business.ceoName}`.toLowerCase().includes(needle)
    })
  }, [businesses, query])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((state) => !state)}
        className="flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left text-sm text-gray-700 shadow-sm transition hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
      >
        <span className="truncate">
          {selected ? `${selected.name} · ${selected.sector}` : 'Select a business'}
        </span>
        <span className={`ml-3 text-gray-400 transition ${open ? 'rotate-180' : ''}`}>v</span>
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
          <div className="border-b border-gray-200 p-3">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search business or sector"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]"
            />
          </div>
          <div className="max-h-72 overflow-y-auto p-2">
            {filteredBusinesses.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-gray-400">No matching businesses.</p>
            ) : (
              filteredBusinesses.map((business) => {
                const active = business.id === value
                return (
                  <button
                    key={business.id}
                    type="button"
                    onClick={() => {
                      onChange(business.id)
                      setOpen(false)
                      setQuery('')
                    }}
                    className={`flex w-full items-start justify-between rounded-xl px-3 py-3 text-left transition ${active ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{business.name}</p>
                      <p className="mt-0.5 text-xs text-gray-500">{business.sector}</p>
                    </div>
                    {active ? <span className="text-xs font-semibold text-[var(--brand-primary)]">Selected</span> : null}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function StickyLegend() {
  const items = [
    {
      range: '0 – 40%',
      label: 'High Priority Gap',
      detail: 'Main gap to be addressed during TA',
      background: '#FCEBEB',
      border: '#F5C6C6',
      color: '#A32D2D',
      dot: '#A32D2D',
    },
    {
      range: '50 – 70%',
      label: 'Low Priority Gap',
      detail: 'Second priority gap to be addressed',
      background: '#FAEEDA',
      border: '#F0D5A0',
      color: '#BA7517',
      dot: '#BA7517',
    },
    {
      range: '80 – 100%',
      label: 'Ideal Performance',
      detail: 'No TA required in this area',
      background: '#E1F5EE',
      border: '#A7DFC8',
      color: '#0F6E56',
      dot: '#0F6E56',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-start gap-3 rounded-xl px-4 py-3"
          style={{ backgroundColor: item.background, border: `1px solid ${item.border}` }}
        >
          <span className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: item.dot }} />
          <div>
            <p className="text-xs font-bold" style={{ color: item.color }}>{item.range}</p>
            <p className="text-sm font-semibold" style={{ color: item.color }}>{item.label}</p>
            <p className="mt-0.5 text-xs" style={{ color: item.color, opacity: 0.8 }}>{item.detail}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function LoadingPanel() {
  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="h-6 w-56 animate-pulse rounded bg-gray-200" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-2xl bg-gray-100" />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-2xl bg-gray-100" />
    </div>
  )
}

export default function AnalyticsDashboardClient({
  bankName,
  businesses,
  defaultBusinessId,
  defaultFrom,
  defaultTo,
  tenantId,
}: {
  bankName: string
  businesses: AnalyticsBusinessSummary[]
  defaultBusinessId: string
  defaultFrom: string
  defaultTo: string
  tenantId: string
}) {
  const [activeTab, setActiveTab] = useState<AnalyticsTabKey>('overview')
  const [businessId, setBusinessId] = useState(defaultBusinessId)
  const [from, setFrom] = useState(defaultFrom)
  const [to, setTo] = useState(defaultTo)
  const [payload, setPayload] = useState<BankAnalyticsPayload | null>(null)
  const [loading, setLoading] = useState(Boolean(defaultBusinessId))
  const [error, setError] = useState<string | null>(null)
  const [scrollAreaKey, setScrollAreaKey] = useState<string | null>(null)
  const [diagnosticMonths, setDiagnosticMonths] = useState<Set<string>>(new Set())
  const [diagnosticDates, setDiagnosticDates] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!businessId) {
      setPayload(null)
      setLoading(false)
      return
    }

    const controller = new AbortController()

    async function loadAnalytics() {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({ businessId, from, to, tenantId })
        const response = await fetch(`/api/bank/analytics?${params.toString()}`, {
          cache: 'no-store',
          signal: controller.signal,
        })
        const result = await response.json()

        if (!response.ok || !result?.success) {
          throw new Error(result?.error ?? 'Failed to load analytics data')
        }

        setPayload(result.data)
      } catch (fetchError) {
        if ((fetchError as Error).name === 'AbortError') return
        setError((fetchError as Error).message)
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    void loadAnalytics()
    return () => controller.abort()
  }, [businessId, from, to, tenantId])

  // Fetch which months/dates have diagnostics when business changes
  useEffect(() => {
    if (!businessId) { setDiagnosticMonths(new Set()); setDiagnosticDates(new Set()); return }
    fetch(`/api/bank/analytics/months?businessId=${businessId}`)
      .then(r => r.json())
      .then(data => {
        setDiagnosticMonths(new Set(data.months ?? []))
        setDiagnosticDates(new Set(data.dates ?? []))
      })
      .catch(() => {})
  }, [businessId])

  // When a date is picked, set from = start of that day, to = end of that day
  const handleDatePick = useCallback((date: string) => {
    setFrom(date)
    setTo(date)
  }, [])

  useEffect(() => {
    if (!scrollAreaKey || activeTab === 'overview') return
    const handle = window.requestAnimationFrame(() => {
      const element = document.getElementById(`area-${scrollAreaKey}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      setScrollAreaKey(null)
    })

    return () => window.cancelAnimationFrame(handle)
  }, [activeTab, scrollAreaKey, payload?.diagnostic?.id])

  const selectedBusiness = businesses.find((business) => business.id === businessId) ?? businesses[0]
  const diagnostic = payload?.diagnostic ?? null

  const tabs: Array<{ key: AnalyticsTabKey; label: string }> = [
    { key: 'overview', label: 'Diagnosis Result Overview' },
    { key: 'strategic', label: 'Strategic Capacity Level' },
    { key: 'process', label: 'Process Capacity Level' },
    { key: 'support', label: 'Support Capacity Level' },
  ]

  async function saveComment(level: AnalyticsLevelKey, comment: string) {
    if (!diagnostic) return

    const response = await fetch('/api/bank/analytics', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ diagnosticId: diagnostic.id, level, comment }),
    })
    const result = await response.json()

    if (!response.ok || !result?.success) {
      throw new Error(result?.error ?? 'Unable to save comment')
    }

    setPayload((current) => {
      if (!current?.diagnostic) return current
      return {
        ...current,
        diagnostic: {
          ...current.diagnostic,
          assessorComment: {
            ...current.diagnostic.assessorComment,
            [level]: comment,
          },
        },
      }
    })
  }

  function handleNavigateToArea(level: AnalyticsLevelKey, areaKey: string) {
    setActiveTab(level)
    setScrollAreaKey(areaKey)
  }

  function renderContent() {
    if (!businesses.length) {
      return (
        <section className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">No businesses found</h2>
          <p className="mt-2 text-sm text-gray-500">Once this tenant has SME submissions, they will appear here for TA diagnosis analysis.</p>
        </section>
      )
    }

    if (loading) return <LoadingPanel />

    if (error) {
      return (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-red-800">Unable to load analytics</h2>
          <p className="mt-1 text-sm text-red-700">{error}</p>
        </section>
      )
    }

    if (!diagnostic) {
      return (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-amber-800">No diagnostic found in the selected range</h2>
          <p className="mt-1 text-sm text-amber-700">Try adjusting the date range or select a different business.</p>
        </section>
      )
    }

    if (!diagnostic.hasFullAnalysis) {
      return (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-amber-800">Full TA analysis not yet available for this diagnostic.</h2>
          <p className="mt-1 text-sm text-amber-700">Ask your assessor to complete the full parameter scoring.</p>
        </section>
      )
    }

    if (activeTab === 'overview') {
      return <OverviewTab diagnostic={diagnostic} onNavigateToArea={handleNavigateToArea} />
    }

    if (activeTab === 'strategic' && diagnostic.strategic) {
      return (
        <LevelTab
          levelKey="strategic"
          title="1. Strategic Capacity Level"
          data={diagnostic.strategic}
          assessorComment={diagnostic.assessorComment.strategic}
          onSaveComment={(comment) => saveComment('strategic', comment)}
        />
      )
    }

    if (activeTab === 'process' && diagnostic.process) {
      return (
        <LevelTab
          levelKey="process"
          title="2. Process Capacity Level"
          data={diagnostic.process}
          assessorComment={diagnostic.assessorComment.process}
          onSaveComment={(comment) => saveComment('process', comment)}
        />
      )
    }

    if (activeTab === 'support' && diagnostic.support) {
      return (
        <LevelTab
          levelKey="support"
          title="3. Support Capacity Level"
          data={diagnostic.support}
          assessorComment={diagnostic.assessorComment.support}
          onSaveComment={(comment) => saveComment('support', comment)}
        />
      )
    }

    return null
  }

  return (
    <div className="mx-auto max-w-7xl p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold text-gray-900">TA Needs Diagnosis Analysis</h1>
        <p className="mt-2 text-sm text-gray-500">{bankName} · Technical Assistance Assessment</p>
      </header>

      <div className="sticky top-0 z-20 -mx-2 mb-6 bg-gray-50/95 px-2 pb-4 pt-1 backdrop-blur">
        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Business Name</label>
              <BusinessSelect businesses={businesses} value={businessId} onChange={setBusinessId} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Diagnostic Period
                {diagnosticDates.size > 0 && (
                  <span className="ml-2 text-xs font-normal text-gray-400">
                    ({diagnosticDates.size} diagnostic{diagnosticDates.size !== 1 ? 's' : ''} available)
                  </span>
                )}
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <DiagnosticDatePicker
                  value={from}
                  onChange={handleDatePick}
                  highlightMonths={diagnosticMonths}
                  highlightDates={diagnosticDates}
                  label="From date"
                />
                <DiagnosticDatePicker
                  value={to}
                  onChange={setTo}
                  highlightMonths={diagnosticMonths}
                  highlightDates={diagnosticDates}
                  label="To date"
                />
              </div>
            </div>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            Showing results for: <span className="font-medium text-gray-900">{selectedBusiness?.name ?? 'No business selected'}</span> · Diagnosis date: <span className="font-medium text-gray-900">{formatDateLabel(diagnostic?.date)}</span> · Assessor: <span className="font-medium text-gray-900">{diagnostic?.assessorName ?? 'Not recorded'}</span>
          </p>
        </section>

        <section className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <StickyLegend />
        </section>
      </div>

      <nav className="mb-6 border-b border-gray-200">
        <div className="flex flex-wrap gap-6">
          {tabs.map((tab) => {
            const active = tab.key === activeTab
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`border-b-2 pb-3 text-sm transition ${active ? 'border-[var(--brand-primary)] font-semibold text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </nav>

      {renderContent()}
    </div>
  )
}
