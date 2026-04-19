'use client'
// src/app/bank/submissions/SubmissionsFilterBar.tsx
// Client component - search + classification + sector filters with URL-driven state

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useTransition, useCallback } from 'react'

interface Props {
  sectors: string[]
  currentSearch: string
  currentClassification: string
  currentSector: string
}

export default function SubmissionsFilterBar({
  sectors,
  currentSearch,
  currentClassification,
  currentSector,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [, startTransition] = useTransition()

  const push = useCallback(
    (updates: Record<string, string>) => {
      const q = new URLSearchParams(params.toString())
      q.delete('page')
      Object.entries(updates).forEach(([k, v]) => {
        if (v) q.set(k, v)
        else q.delete(k)
      })
      startTransition(() => router.push(`${pathname}?${q.toString()}`))
    },
    [params, pathname, router],
  )

  const hasFilters = currentSearch || currentClassification || currentSector

  return (
    <div className="flex flex-wrap items-center gap-3 mb-1">
      <div className="relative flex-1 min-w-[220px]">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search business or CEO..."
          defaultValue={currentSearch}
          onChange={e => push({ search: e.target.value })}
          className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-[var(--brand-primary,#185FA5)]
                     placeholder-gray-400 text-gray-800"
        />
      </div>

      <select
        value={currentClassification}
        onChange={e => push({ classification: e.target.value })}
        className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-2.5
                   text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary,#185FA5)]"
      >
        <option value="">All classifications</option>
        <option value="investment_ready">Investment Ready</option>
        <option value="conditionally_lendable">Conditionally Lendable</option>
        <option value="high_risk">High Risk</option>
      </select>

      {sectors.length > 0 && (
        <select
          value={currentSector}
          onChange={e => push({ sector: e.target.value })}
          className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-2.5
                     text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary,#185FA5)]"
        >
          <option value="">All sectors</option>
          {sectors.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      )}

      {hasFilters && (
        <button
          onClick={() => push({ search: '', classification: '', sector: '' })}
          className="text-sm font-medium text-gray-500 hover:text-gray-800 px-3 py-2.5 rounded-lg
                     border border-gray-100 bg-white hover:bg-gray-50 transition-colors"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}
