// src/app/sme/diagnostics/page.tsx
// SME diagnostic history page - server component

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { connectDB } from '@/lib/db'
import { User, Business, Diagnostic, Tenant } from '@/models'

// ── HELPERS ───────────────────────────────────────────────

function classifyGap(pct: number) {
  if (pct >= 80) return { label: 'Ideal Performance', color: '#0F6E56', bg: '#E1F5EE' }
  if (pct >= 50) return { label: 'Low Priority Gap',  color: '#BA7517', bg: '#FAEEDA' }
  return           { label: 'High Priority Gap',  color: '#A32D2D', bg: '#FCEBEB' }
}

function indexColor(idx: number) {
  if (idx >= 80) return '#0F6E56'
  if (idx >= 60) return '#BA7517'
  return '#A32D2D'
}

function classLabel(c: string) {
  if (c === 'investment_ready')       return 'Investment Ready'
  if (c === 'conditionally_lendable') return 'Conditionally Lendable'
  return 'High Risk'
}

function formatDate(d: any) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── PAGE ──────────────────────────────────────────────────

export default async function SMEDiagnosticsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  await connectDB()

  const user = await User.findOne({ clerkId: userId }).lean() as any
  if (!user || user.role !== 'sme') redirect('/dashboard')

  const business = user.businessId
    ? await Business.findById(user.businessId).lean() as any
    : null

  const tenant = business?.tenantId
    ? await Tenant.findById(business.tenantId).lean() as any
    : null

  const diagnostics = business
    ? await Diagnostic.find({ businessId: business._id })
        .sort({ createdAt: -1 })
        .lean() as any[]
    : []

  // Empty state
  if (!business || diagnostics.length === 0) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">My Diagnostics</h1>
          <p className="text-sm text-gray-500 mt-1">Your assessment history and reports</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5 text-3xl">
            📊
          </div>
          <h2 className="text-base font-semibold text-gray-900 mb-2">No Assessments Yet</h2>
          <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
            Complete your first diagnostic to receive a personalised business readiness score and recommendations.
          </p>
          {tenant?.slug && (
            <Link href={`/diagnostic/${tenant.slug}`}
              className="inline-block px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors">
              Take Your Diagnostic
            </Link>
          )}
        </div>
      </div>
    )
  }

  // Stats summary
  const scored      = diagnostics.filter((d: any) => d.result)
  const avgIndex    = scored.length > 0
    ? Math.round(scored.reduce((s: number, d: any) => s + (d.result?.lendabilityIndex ?? 0), 0) / scored.length)
    : 0
  const latestIdx   = diagnostics[0]?.result?.lendabilityIndex ?? null
  const latestCls   = diagnostics[0]?.result?.classification   ?? null

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Diagnostics</h1>
          <p className="text-sm text-gray-500 mt-1">{business.name}</p>
        </div>
        {tenant?.slug && (
          <Link href={`/diagnostic/${tenant.slug}`}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors">
            + New Diagnostic
          </Link>
        )}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: 'Total Assessments',
            value: String(diagnostics.length),
            sub:   `${scored.length} scored`,
          },
          {
            label: 'Average Index',
            value: scored.length > 0 ? `${avgIndex}` : '-',
            sub:   scored.length > 0 ? classLabel(avgIndex >= 80 ? 'investment_ready' : avgIndex >= 60 ? 'conditionally_lendable' : 'high_risk') : 'No scores yet',
          },
          {
            label: 'Latest Score',
            value: latestIdx !== null ? `${latestIdx}` : '-',
            sub:   latestCls ? classLabel(latestCls) : 'Not scored',
            color: latestIdx !== null ? indexColor(latestIdx) : '#6B7280',
          },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1">{card.label}</p>
            <p className="text-2xl font-bold text-gray-900" style={{ color: (card as any).color }}>{card.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Diagnostics table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">All Assessments</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Date', 'Period', 'Index', 'Classification', 'Strategic', 'Process', 'Support', 'Report'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {diagnostics.map((d: any) => {
                const r   = d.result
                const di  = r?.lendabilityIndex ?? null
                const dc  = r?.classification   ?? null
                const ds  = r?.strategic?.percentage ?? null
                const dp  = (r?.process ?? r?.operational)?.percentage ?? null
                const dsu = r?.support?.percentage ?? null
                const gap = di !== null ? classifyGap(di) : null

                return (
                  <tr
                    key={String(d._id)}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">{formatDate(d.createdAt)}</td>
                    <td className="px-4 py-3.5 text-gray-700 font-medium">{d.period}</td>
                    <td className="px-4 py-3.5">
                      {di !== null ? (
                        <span className="font-bold text-sm" style={{ color: indexColor(di) }}>{di}</span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {gap && dc ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap"
                          style={{ background: gap.bg, color: gap.color }}>
                          {classLabel(dc)}
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {ds !== null ? `${ds}%` : <span className="text-gray-300">-</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {dp !== null ? `${dp}%` : <span className="text-gray-300">-</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {dsu !== null ? `${dsu}%` : <span className="text-gray-300">-</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/sme/diagnostics/${String(d._id)}`}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline whitespace-nowrap"
                      >
                        View Report
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
