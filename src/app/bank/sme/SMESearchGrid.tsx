'use client'
// src/app/bank/sme/SMESearchGrid.tsx
// Client component - search bar + responsive card grid over pre-fetched SME data

import Link from 'next/link'
import { useState, useMemo } from 'react'
import type { SMECardData } from './page'

interface Props {
  cards: SMECardData[]
  primaryColor: string
}

function taBadge(status: string) {
  if (status === 'active')    return { label: 'TA Active',    color: '#185FA5', bg: '#EBF2FB' }
  if (status === 'completed') return { label: 'TA Completed', color: '#0F6E56', bg: '#E1F5EE' }
  return                             { label: 'No TA',        color: '#9CA3AF', bg: '#F9FAFB' }
}

export default function SMESearchGrid({ cards, primaryColor }: Props) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    if (!query.trim()) return cards
    const needle = query.toLowerCase()
    return cards.filter(
      c =>
        c.name.toLowerCase().includes(needle) ||
        c.ceoName.toLowerCase().includes(needle) ||
        c.sector.toLowerCase().includes(needle) ||
        c.location.toLowerCase().includes(needle),
    )
  }, [cards, query])

  return (
    <>
      {/* Search bar */}
      <div className="relative mb-6 max-w-md">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search by name, CEO, sector or location..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-lg
                     shadow-sm placeholder-gray-400 text-gray-800 focus:outline-none focus:ring-2
                     focus:ring-offset-0"
          style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            &times;
          </button>
        )}
      </div>

      {/* Result count when searching */}
      {query && (
        <p className="text-xs text-gray-500 mb-4">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''} for &quot;{query}&quot;
        </p>
      )}

      {/* Empty search state */}
      {filtered.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <p className="text-sm text-gray-500">No businesses match &quot;{query}&quot;.</p>
          <button
            onClick={() => setQuery('')}
            className="mt-3 text-xs font-medium text-gray-400 hover:text-gray-600 underline"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Card grid */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(card => {
            const ta = taBadge(card.taStatus)
            return (
              <Link
                key={card.businessId}
                href={`/bank/sme/${card.businessId}`}
                className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md
                           hover:border-gray-200 transition-all duration-150 overflow-hidden flex flex-col"
              >
                {/* Card header strip */}
                <div className="h-1.5 w-full" style={{ background: primaryColor }} />

                <div className="p-5 flex flex-col gap-4 flex-1">
                  {/* Top row: avatar + name + sector */}
                  <div className="flex items-start gap-4">
                    {/* CEO initials avatar */}
                    <div
                      className="w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center
                                 text-white text-sm font-bold shadow-sm"
                      style={{ background: card.avatarColor }}
                    >
                      {card.ceoInitials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2
                                     group-hover:text-[var(--brand-primary)] transition-colors">
                        {card.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{card.ceoName}</p>
                    </div>
                    {/* Sector badge */}
                    <span className="flex-shrink-0 text-xs font-medium bg-gray-100 text-gray-600
                                     px-2.5 py-1 rounded-full self-start">
                      {card.sector}
                    </span>
                  </div>

                  {/* Score circle + classification */}
                  <div className="flex items-center gap-4">
                    {card.latestScore !== null && card.classification ? (
                      <>
                        {/* Score circle */}
                        <div
                          className="w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center
                                     border-2 font-bold text-base"
                          style={{
                            borderColor: card.classification.color,
                            color:       card.classification.color,
                            background:  card.classification.bg,
                          }}
                        >
                          {Math.round(card.latestScore)}
                        </div>
                        <div>
                          <div
                            className="text-xs font-semibold px-2.5 py-1 rounded-full inline-block"
                            style={{ color: card.classification.color, background: card.classification.bg }}
                          >
                            {card.classification.label}
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            {card.diagnosticCount} diagnostic{card.diagnosticCount !== 1 ? 's' : ''} completed
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-full border-2 border-dashed border-gray-200
                                         flex items-center justify-center">
                          <span className="text-xs text-gray-300 font-medium">-</span>
                        </div>
                        <p className="text-xs text-gray-400">No assessment yet</p>
                      </div>
                    )}
                  </div>

                  {/* Footer: TA status + date joined + location */}
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ color: ta.color, background: ta.bg }}
                    >
                      {ta.label}
                    </span>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">{card.dateJoined}</p>
                      {card.location && (
                        <p className="text-xs text-gray-400 truncate max-w-[120px]">{card.location}</p>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}
