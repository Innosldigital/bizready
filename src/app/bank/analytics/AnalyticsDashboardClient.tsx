'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
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
      label: '0-40% = High Priority Gap - Main gap to be addressed during TA',
      background: '#FCEBEB',
      color: '#A32D2D',
    },
    {
      label: '50-70% = Low Priority Gap - Second priority gap to be addressed',
      background: '#FAEEDA',
      color: '#BA7517',
    },
    {
      label: '80-100% = Ideal Performance - No TA required in this area',
      background: '#E1F5EE',
      color: '#0F6E56',
    },
  ]

  return (
    <div className="flex flex-wrap gap-3">
      {items.map((item) => (
        <span
          key={item.label}
          className="inline-flex rounded-full px-4 py-2 text-sm font-medium"
          style={{ backgroundColor: item.background, color: item.color }}
        >
          {item.label}
        </span>
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
              <label className="mb-2 block text-sm font-medium text-gray-700">Month Range</label>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="month"
                  value={from}
                  onChange={(event) => setFrom(event.target.value)}
                  className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm outline-none transition focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]"
                />
                <input
                  type="month"
                  value={to}
                  onChange={(event) => setTo(event.target.value)}
                  className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm outline-none transition focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]"
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
