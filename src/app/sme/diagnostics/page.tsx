// src/app/sme/diagnostics/page.tsx
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { connectDB } from '@/lib/db'
import { User, Business, Diagnostic, Tenant } from '@/models'

function indexBg(idx: number) {
  if (idx >= 80) return 'linear-gradient(135deg,#0F6E56,#1a9a78)'
  if (idx >= 60) return 'linear-gradient(135deg,#B45309,#d97706)'
  return 'linear-gradient(135deg,#991B1B,#dc2626)'
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

function classBadge(c: string) {
  if (c === 'investment_ready')       return { bg: '#E1F5EE', color: '#0F6E56' }
  if (c === 'conditionally_lendable') return { bg: '#FAEEDA', color: '#BA7517' }
  return { bg: '#FCEBEB', color: '#A32D2D' }
}

function formatDate(d: any) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const r = (size - 10) / 2
  const circ = 2 * Math.PI * r
  const fill = (score / 100) * circ
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={5} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="white" strokeWidth={5}
        strokeDasharray={`${fill} ${circ}`} strokeLinecap="round" />
    </svg>
  )
}

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

  if (!business || diagnostics.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Assessments</h1>
          <p className="text-sm text-gray-500 mt-1">{business?.name ?? 'Your business'}</p>
        </div>
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200/60 p-16 text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center text-3xl"
            style={{ background: 'linear-gradient(135deg,#F3F0FF,#E8F5E9)' }}>
            📊
          </div>
          <h2 className="text-base font-semibold text-gray-900 mb-2">No assessments yet</h2>
          <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto leading-relaxed">
            Complete your first diagnostic to receive a personalised business readiness score.
          </p>
          {tenant?.slug && (
            <Link href={`/diagnostic/${tenant.slug}`}
              className="inline-block px-6 py-2.5 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#5B1FA8,#185FA5)' }}>
              Take your diagnostic
            </Link>
          )}
        </div>
      </div>
    )
  }

  const scored   = diagnostics.filter((d: any) => d.result)
  const avgIndex = scored.length > 0
    ? Math.round(scored.reduce((s: number, d: any) => s + (d.result?.lendabilityIndex ?? 0), 0) / scored.length)
    : 0
  const latest    = diagnostics[0]
  const latestIdx = latest?.result?.lendabilityIndex ?? null
  const latestCls = latest?.result?.classification   ?? null

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Assessments</h1>
          <p className="text-sm text-gray-500 mt-1">{business.name}</p>
        </div>
        {tenant?.slug && (
          <Link href={`/diagnostic/${tenant.slug}`}
            className="px-5 py-2 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#5B1FA8,#185FA5)' }}>
            + New assessment
          </Link>
        )}
      </div>

      {/* Latest result hero */}
      {latestIdx !== null && latestCls && (
        <div className="rounded-3xl shadow-xl p-8 text-white relative overflow-hidden"
          style={{ background: indexBg(latestIdx) }}>
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 0%, transparent 60%)' }} />
          <div className="relative flex items-center gap-8">
            <div className="flex-shrink-0 relative flex items-center justify-center">
              <ScoreRing score={latestIdx} size={100} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-thin leading-none">{latestIdx}</span>
                <span className="text-[9px] opacity-70 mt-0.5">/ 100</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium opacity-70 uppercase tracking-widest mb-1">Latest Assessment</p>
              <p className="text-xl font-semibold mb-1">{classLabel(latestCls)}</p>
              <p className="text-sm opacity-80">{formatDate(latest?.createdAt)}</p>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-xs opacity-70 mb-2">Average across {scored.length} assessment{scored.length !== 1 ? 's' : ''}</p>
              <p className="text-4xl font-thin">{avgIndex}</p>
              <p className="text-xs opacity-70">avg. index</p>
            </div>
          </div>
        </div>
      )}

      {/* Stat strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total assessments', value: diagnostics.length, sub: `${scored.length} scored` },
          { label: 'Average index',     value: scored.length > 0 ? avgIndex : '—', sub: scored.length > 0 ? classLabel(avgIndex >= 80 ? 'investment_ready' : avgIndex >= 60 ? 'conditionally_lendable' : 'high_risk') : 'No scores yet', color: scored.length > 0 ? indexColor(avgIndex) : undefined },
          { label: 'Latest score',      value: latestIdx !== null ? latestIdx : '—', sub: latestCls ? classLabel(latestCls) : 'Not scored', color: latestIdx !== null ? indexColor(latestIdx) : undefined },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-5">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2">{card.label}</p>
            <p className="text-3xl font-thin text-gray-900 leading-none mb-1"
              style={card.color ? { color: card.color } : {}}>
              {card.value}
            </p>
            <p className="text-xs text-gray-400">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Assessment cards */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider px-1">All assessments</h2>
        {diagnostics.map((d: any, i: number) => {
          const r   = d.result
          const di  = r?.lendabilityIndex ?? null
          const dc  = r?.classification   ?? null
          const ds  = r?.strategic?.percentage ?? null
          const dp  = (r?.process ?? r?.operational)?.percentage ?? null
          const dsu = r?.support?.percentage ?? null
          const badge = dc ? classBadge(dc) : null

          return (
            <div key={String(d._id)}
              className="bg-white rounded-3xl shadow-sm border border-gray-200/60 p-6 flex items-center gap-5">

              {/* Number */}
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white flex-shrink-0"
                style={{ background: di !== null ? indexBg(di) : 'linear-gradient(135deg,#9CA3AF,#6B7280)' }}>
                {diagnostics.length - i}
              </div>

              {/* Date + period */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{d.period ?? formatDate(d.createdAt)}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatDate(d.createdAt)}</p>
              </div>

              {/* Classification badge */}
              {badge && dc ? (
                <span className="hidden sm:inline px-3 py-1 rounded-full text-[11px] font-medium flex-shrink-0"
                  style={{ background: badge.bg, color: badge.color }}>
                  {classLabel(dc)}
                </span>
              ) : (
                <span className="hidden sm:inline text-xs text-gray-300 flex-shrink-0">Not scored</span>
              )}

              {/* Sub-scores */}
              <div className="hidden md:flex items-center gap-5 flex-shrink-0">
                {[
                  { label: 'Strategic', val: ds },
                  { label: 'Process',   val: dp },
                  { label: 'Support',   val: dsu },
                ].map(sub => (
                  <div key={sub.label} className="text-center">
                    <p className="text-[10px] text-gray-400">{sub.label}</p>
                    <p className="text-sm font-semibold text-gray-700">
                      {sub.val !== null && sub.val !== undefined ? `${sub.val}%` : '—'}
                    </p>
                  </div>
                ))}
              </div>

              {/* Score */}
              {di !== null ? (
                <div className="flex-shrink-0 text-right">
                  <p className="text-2xl font-thin leading-none" style={{ color: indexColor(di) }}>{di}</p>
                  <p className="text-[10px] text-gray-400">index</p>
                </div>
              ) : (
                <div className="flex-shrink-0 text-right">
                  <p className="text-2xl font-thin text-gray-300">—</p>
                </div>
              )}

              {/* Link */}
              <Link href={`/sme/diagnostics/${String(d._id)}`}
                className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors text-sm">
                →
              </Link>
            </div>
          )
        })}
      </div>

    </div>
  )
}
