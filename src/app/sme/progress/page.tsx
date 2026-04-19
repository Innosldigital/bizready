// src/app/sme/progress/page.tsx
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { connectDB } from '@/lib/db'
import { User, Business, Diagnostic, TAProgramme, Tenant } from '@/models'

function indexColor(idx: number) {
  if (idx >= 80) return '#0F6E56'
  if (idx >= 60) return '#BA7517'
  return '#A32D2D'
}
function indexBg(idx: number) {
  if (idx >= 80) return 'linear-gradient(135deg,#0F2D22,#0F6E56)'
  if (idx >= 60) return 'linear-gradient(135deg,#2D1A00,#BA7517)'
  return 'linear-gradient(135deg,#2D0A0A,#A32D2D)'
}
function classLabel(c: string) {
  if (c === 'investment_ready')       return 'Investment Ready'
  if (c === 'conditionally_lendable') return 'Conditionally Lendable'
  return 'High Risk'
}
function classTagBg(c: string) {
  if (c === 'investment_ready')       return 'rgba(255,255,255,0.15)'
  if (c === 'conditionally_lendable') return 'rgba(255,255,255,0.15)'
  return 'rgba(255,255,255,0.15)'
}
function formatDate(d: any) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function ScoreRing({ index, size = 160 }: { index: number; size?: number }) {
  const color  = indexColor(index)
  const r      = (size / 2) - 14
  const circ   = 2 * Math.PI * r
  const fill   = (index / 100) * circ
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="rgba(255,255,255,0.12)" strokeWidth="10" />
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="rgba(255,255,255,0.9)" strokeWidth="10"
        strokeDasharray={`${fill} ${circ - fill}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} />
      <text x={size/2} y={size/2 - 10} textAnchor="middle" dominantBaseline="central"
        fontSize="36" fontWeight="200" fill="white">{index}</text>
      <text x={size/2} y={size/2 + 16} textAnchor="middle" dominantBaseline="central"
        fontSize="11" fill="rgba(255,255,255,0.6)">out of 100</text>
    </svg>
  )
}

export default async function SMEProgressPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  await connectDB()

  const user = await User.findOne({ clerkId: userId }).lean() as any
  if (!user || user.role !== 'sme') redirect('/dashboard')

  const business = user.businessId
    ? await Business.findById(user.businessId).lean() as any
    : null

  if (!business) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-3xl bg-white shadow-lg flex items-center justify-center mx-auto mb-6 text-4xl">📋</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">No Business Profile</h1>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Complete your business profile to unlock your investment readiness assessment.
          </p>
          <Link href="/onboarding"
            className="inline-block px-6 py-3 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#5B1FA8,#185FA5)' }}>
            Complete Profile
          </Link>
        </div>
      </div>
    )
  }

  const diagnostics = await Diagnostic.find({ businessId: business._id })
    .sort({ createdAt: -1 }).lean() as any[]
  const tenant = await Tenant.findById(business.tenantId).lean() as any

  if (diagnostics.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-3xl bg-emerald-50 flex items-center justify-center mx-auto mb-6 text-4xl">🎯</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">No Assessments Yet</h1>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Take your first diagnostic to receive your Investment Readiness Index and personalised TA recommendations.
          </p>
          {tenant?.slug && (
            <Link href={`/diagnostic/${tenant.slug}`}
              className="inline-block px-6 py-3 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#0F6E56,#185FA5)' }}>
              Start Diagnostic
            </Link>
          )}
        </div>
      </div>
    )
  }

  const latest = diagnostics[0]
  const result = latest?.result ?? null
  const idx    = result?.lendabilityIndex ?? 0
  const cls    = result?.classification   ?? 'high_risk'
  const strat  = result?.strategic?.percentage ?? 0
  const proc   = (result?.process ?? result?.operational)?.percentage ?? 0
  const supp   = result?.support?.percentage ?? 0

  const taPrograms = await TAProgramme.find({ businessId: business._id })
    .sort({ createdAt: -1 }).lean() as any[]
  const activeTAs    = taPrograms.filter((t: any) => t.status === 'active')
  const completedTAs = taPrograms.filter((t: any) => t.status === 'completed')

  const ctaConfig = {
    high_risk:              { title: 'Development Programme Required', body: 'Your bank will design a structured development programme to address critical capacity gaps. This is your first step toward investment readiness.', accent: '#A32D2D' },
    conditionally_lendable: { title: 'Complete Your TA Programme',     body: 'You\'re close. Completing your Technical Assistance programme will push your index above 80 and unlock access to finance.',            accent: '#BA7517' },
    investment_ready:       { title: 'You Are Eligible for a Loan',    body: 'Congratulations — your business has reached Investment Ready status. Contact your bank today to begin the credit appraisal process.',  accent: '#0F6E56' },
  }
  const cta = ctaConfig[cls as keyof typeof ctaConfig] ?? ctaConfig.high_risk

  return (
    <div className="space-y-5">

      {/* ── HERO SCORE CARD ─────────────────────────────── */}
      <div className="rounded-3xl overflow-hidden shadow-xl" style={{ background: indexBg(idx) }}>
        <div className="px-8 pt-8 pb-6">
          {/* Top row */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-widest text-white/50 mb-1">
                Investment Readiness
              </p>
              <h1 className="text-2xl font-semibold text-white leading-tight">{business.name}</h1>
              <p className="text-sm text-white/50 mt-0.5">Last assessed {formatDate(latest.createdAt)} · {latest.period}</p>
            </div>
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold text-white"
              style={{ background: classTagBg(cls), border: '1px solid rgba(255,255,255,0.2)' }}>
              {classLabel(cls)}
            </span>
          </div>

          {/* Score + sub-scores */}
          <div className="flex items-center gap-8">
            <ScoreRing index={idx} size={160} />
            <div className="flex-1 space-y-4">
              {[
                { label: 'Strategic', value: strat, weight: '30%' },
                { label: 'Process',   value: proc,  weight: '45%' },
                { label: 'Support',   value: supp,  weight: '25%' },
              ].map(row => (
                <div key={row.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-medium text-white/70">{row.label}
                      <span className="text-white/35 ml-1">({row.weight})</span>
                    </span>
                    <span className="text-sm font-semibold text-white">{row.value}%</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.12)' }}>
                    <div className="h-1.5 rounded-full transition-all duration-700"
                      style={{ width: `${row.value}%`, background: 'rgba(255,255,255,0.75)' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 divide-x border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          {[
            { label: 'Assessments', value: diagnostics.length },
            { label: 'Active TAs',  value: activeTAs.length },
            { label: 'Completed',   value: completedTAs.length },
          ].map(s => (
            <div key={s.label} className="px-6 py-4 text-center" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <p className="text-xl font-semibold text-white">{s.value}</p>
              <p className="text-[11px] text-white/45 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 12-AREA BREAKDOWN ───────────────────────────── */}
      {result?.areaScores?.length > 0 && (
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-[15px] font-semibold text-gray-900">12-Area Breakdown</h2>
            <p className="text-[13px] text-gray-400 mt-0.5">Capacity scores across all assessment areas</p>
          </div>
          <div className="divide-y divide-gray-50">
            {[...result.areaScores]
              .sort((a: any, b: any) => a.areaNumber - b.areaNumber)
              .map((area: any) => {
                const c = area.percentage >= 80 ? '#0F6E56' : area.percentage >= 50 ? '#BA7517' : '#A32D2D'
                const bg = area.percentage >= 80 ? '#E1F5EE' : area.percentage >= 50 ? '#FAEEDA' : '#FCEBEB'
                return (
                  <details key={area.areaKey} className="group">
                    <summary className="flex items-center gap-4 px-6 py-4 cursor-pointer list-none hover:bg-gray-50 transition-colors">
                      <span className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0"
                        style={{ background: bg, color: c }}>
                        {area.areaNumber}
                      </span>
                      <span className="flex-1 text-[13px] font-medium text-gray-800">{area.areaName}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-1.5 rounded-full bg-gray-100 overflow-hidden hidden sm:block">
                          <div className="h-1.5 rounded-full" style={{ width: `${area.percentage}%`, background: c }} />
                        </div>
                        <span className="text-sm font-semibold w-12 text-right" style={{ color: c }}>{area.percentage}%</span>
                        <svg className="w-4 h-4 text-gray-300 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </summary>
                    {area.parameterScores?.length > 0 && (
                      <div className="px-6 pb-4 pt-1 bg-gray-50/60 space-y-2">
                        {area.parameterScores.map((p: any) => {
                          const pc = p.score >= 8 ? '#0F6E56' : p.score >= 5 ? '#BA7517' : '#A32D2D'
                          return (
                            <div key={p.parameterId} className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">{p.parameterName}</span>
                              <span className="font-medium" style={{ color: pc }}>{p.score}/10</span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </details>
                )
              })}
          </div>
        </div>
      )}

      {/* ── TA PROGRAMMES ───────────────────────────────── */}
      {taPrograms.length > 0 && (
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-semibold text-gray-900">Development Programmes</h2>
              <p className="text-[13px] text-gray-400 mt-0.5">{activeTAs.length} active · {completedTAs.length} completed</p>
            </div>
            <Link href="/sme/ta" className="text-[13px] font-medium text-violet-700 hover:text-violet-900">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {taPrograms.slice(0, 4).map((tp: any) => {
              const pct = tp.progressPercent ?? 0
              const sc  = tp.status === 'completed' ? '#0F6E56' : tp.status === 'active' ? '#185FA5' : '#6B7280'
              const sbg = tp.status === 'completed' ? '#E1F5EE' : tp.status === 'active' ? '#EFF6FF' : '#F3F4F6'
              return (
                <div key={String(tp._id)} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <p className="text-[13px] font-medium text-gray-800 leading-snug">{tp.area}</p>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold capitalize flex-shrink-0"
                      style={{ background: sbg, color: sc }}>{tp.status}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: sc }} />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1.5">{pct}% complete · {tp.timeframeWeeks}w programme</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── ASSESSMENT HISTORY ──────────────────────────── */}
      <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-gray-900">Assessment History</h2>
          <Link href="/sme/diagnostics" className="text-[13px] font-medium text-violet-700 hover:text-violet-900">
            View all →
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {diagnostics.slice(0, 5).map((d: any, i: number) => {
            const di  = d.result?.lendabilityIndex ?? null
            const dc  = d.result?.classification   ?? null
            const col = di !== null ? indexColor(di) : '#9CA3AF'
            return (
              <div key={String(d._id)}
                className="flex items-center gap-4 px-6 py-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: di !== null ? indexBg(di) : '#E5E7EB' }}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-gray-800">{d.period}</p>
                  <p className="text-[11px] text-gray-400">{formatDate(d.createdAt)}</p>
                </div>
                {di !== null && (
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-semibold" style={{ color: col }}>{di}%</p>
                    {dc && <p className="text-[10px] text-gray-400">{classLabel(dc)}</p>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── NEXT STEP CTA ───────────────────────────────── */}
      <div className="rounded-3xl p-7 shadow-sm" style={{
        background: cls === 'investment_ready'
          ? 'linear-gradient(135deg,#E1F5EE,#F0FDF4)'
          : cls === 'conditionally_lendable'
          ? 'linear-gradient(135deg,#FAEEDA,#FFF7ED)'
          : 'linear-gradient(135deg,#FCEBEB,#FFF5F5)',
      }}>
        <h3 className="text-base font-semibold mb-1.5" style={{ color: cta.accent }}>{cta.title}</h3>
        <p className="text-[13px] leading-relaxed" style={{ color: cta.accent + 'CC' }}>{cta.body}</p>
        {tenant?.slug && cls !== 'high_risk' && (
          <Link href={`/diagnostic/${tenant.slug}`}
            className="inline-block mt-4 px-5 py-2.5 rounded-full text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: cta.accent }}>
            Retake Diagnostic
          </Link>
        )}
      </div>

    </div>
  )
}
