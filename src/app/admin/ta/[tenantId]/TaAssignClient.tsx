'use client'
// src/app/admin/ta/[tenantId]/TaAssignClient.tsx

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ROLE_LABELS } from '@/lib/roles'

const CLS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  investment_ready:       { bg: '#E1F5EE', text: '#0F6E56', label: 'Investment Ready' },
  conditionally_lendable: { bg: '#FAEEDA', text: '#BA7517', label: 'Conditionally Lendable' },
  high_risk:              { bg: '#FCEBEB', text: '#A32D2D', label: 'High Risk' },
}

type Props = {
  tenant:       any
  businesses:   any[]
  focalPersons: any[]
}

export default function TaAssignClient({ tenant, businesses, focalPersons }: Props) {
  const [rows, setRows]         = useState(businesses)
  const [filter, setFilter]     = useState<'all' | 'unassigned' | 'investment_ready' | 'conditionally_lendable' | 'high_risk'>('all')
  const [search, setSearch]     = useState('')
  const [saving, setSaving]     = useState<string | null>(null)
  const [error, setError]       = useState<string | null>(null)

  const filtered = useMemo(() => {
    return rows.filter(b => {
      const matchSearch = !search || b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.ceoName?.toLowerCase().includes(search.toLowerCase())
      const cls = b.diagnostic?.classification
      if (filter === 'unassigned') return matchSearch && !b.focalPersonId
      if (filter === 'investment_ready') return matchSearch && cls === 'investment_ready'
      if (filter === 'conditionally_lendable') return matchSearch && cls === 'conditionally_lendable'
      if (filter === 'high_risk') return matchSearch && cls === 'high_risk'
      return matchSearch
    })
  }, [rows, filter, search])

  async function assignFocalPerson(businessId: string, focalPersonId: string | null) {
    setSaving(businessId)
    setError(null)
    try {
      const res = await fetch('/api/admin/ta', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'assign_focal_person', businessId, focalPersonId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setRows(prev => prev.map(b =>
        b._id === businessId
          ? { ...b, focalPersonId, focalPersonName: data.focalPersonName }
          : b
      ))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(null)
    }
  }

  const unassignedCount = rows.filter(b => !b.focalPersonId).length

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* Back + Header */}
      <div className="mb-5">
        <Link href="/admin/ta" className="text-xs text-gray-500 hover:text-gray-800 mb-3 inline-block">← Back to TA Programmes</Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{tenant.name}</h1>
            <p className="text-sm text-gray-500">TA Programme — assign InnoSL focal persons to each business</p>
          </div>
          {unassignedCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700 font-medium shrink-0">
              {unassignedCount} unassigned
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total businesses', value: rows.length },
          { label: 'Assigned',         value: rows.length - unassignedCount, green: true },
          { label: 'Unassigned',       value: unassignedCount, amber: unassignedCount > 0 },
          { label: 'Avg score',        value: rows.length > 0
              ? `${Math.round(rows.reduce((s, b) => s + (b.diagnostic?.lendabilityIndex ?? 0), 0) / rows.length)}%`
              : '—'
          },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-3.5">
            <p className={`text-xl font-bold ${s.amber ? 'text-amber-600' : s.green ? 'text-green-700' : 'text-gray-900'}`}>{s.value}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <input
          type="text"
          placeholder="Search by business or CEO name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 w-56 focus:outline-none focus:ring-1 focus:ring-purple-300"
        />
        {(['all', 'unassigned', 'investment_ready', 'conditionally_lendable', 'high_risk'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              filter === f
                ? 'bg-purple-700 text-white border-purple-700'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}>
            {f === 'all' ? 'All' : f === 'unassigned' ? 'Unassigned' :
             f === 'investment_ready' ? 'Investment Ready' :
             f === 'conditionally_lendable' ? 'Conditionally Lendable' : 'High Risk'}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-3 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-xs text-red-700">{error}</div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr className="text-[11px] text-gray-500 uppercase tracking-wide">
              <th className="text-left px-4 py-3">Business</th>
              <th className="text-left px-4 py-3">Sector</th>
              <th className="text-right px-3 py-3">Score</th>
              <th className="text-left px-3 py-3">Classification</th>
              <th className="text-left px-4 py-3">Capacity breakdown</th>
              <th className="text-left px-4 py-3">Focal person</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">No businesses match this filter.</td></tr>
            ) : filtered.map(biz => {
              const d = biz.diagnostic
              const cls = d?.classification
              const badge = cls ? CLS_BADGE[cls] : null
              const isSaving = saving === biz._id

              return (
                <tr key={biz._id} className="hover:bg-gray-50/40">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 text-sm">{biz.name}</p>
                    <p className="text-[11px] text-gray-400">{biz.ceoName} · {biz.district || biz.location || '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{biz.sector}</td>
                  <td className="px-3 py-3 text-right">
                    {d ? (
                      <span className="text-sm font-bold" style={{ color: badge?.text ?? '#888' }}>
                        {d.lendabilityIndex}%
                      </span>
                    ) : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-3 py-3">
                    {badge ? (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                        style={{ background: badge.bg, color: badge.text }}>
                        {badge.label}
                      </span>
                    ) : <span className="text-gray-300 text-xs">No diagnostic</span>}
                  </td>
                  <td className="px-4 py-3">
                    {d ? (
                      <div className="flex gap-2 text-[11px] text-gray-500">
                        <span>S {d.strategic ?? '—'}%</span>
                        <span>·</span>
                        <span>P {d.process ?? '—'}%</span>
                        <span>·</span>
                        <span>Sup {d.support ?? '—'}%</span>
                      </div>
                    ) : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      disabled={isSaving}
                      value={biz.focalPersonId ?? ''}
                      onChange={e => assignFocalPerson(biz._id, e.target.value || null)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-purple-300 disabled:opacity-50 w-44"
                    >
                      <option value="">— Unassigned —</option>
                      {focalPersons.map(fp => (
                        <option key={fp._id} value={fp._id}>
                          {fp.name} ({ROLE_LABELS[fp.role] ?? fp.role})
                        </option>
                      ))}
                    </select>
                    {isSaving && <span className="text-[10px] text-purple-500 ml-1">Saving…</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
