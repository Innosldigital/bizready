// src/app/sme/progress/page.tsx
// SME personal progress page - server component

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { connectDB } from '@/lib/db'
import { User, Business, Diagnostic, TAProgramme, Tenant } from '@/models'
import { BankFunnel } from '@/components/funnel/InvestmentFunnel'

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

function ScoreCircle({ index, size = 128 }: { index: number; size?: number }) {
  const color = indexColor(index)
  const r     = (size / 2) - 10
  const circ  = 2 * Math.PI * r
  const fill  = (index / 100) * circ
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F3F4F6" strokeWidth="12" />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth="12"
        strokeDasharray={`${fill} ${circ - fill}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x={size / 2} y={size / 2 - 7} textAnchor="middle" dominantBaseline="central"
        fontSize="26" fontWeight="800" fill={color}>{index}</text>
      <text x={size / 2} y={size / 2 + 14} textAnchor="middle" dominantBaseline="central"
        fontSize="10" fill="#9CA3AF">out of 100</text>
    </svg>
  )
}

function CapacityBar({ label, pct }: { label: string; pct: number }) {
  const gap = classifyGap(pct)
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1.5">
        <span className="font-medium text-gray-700">{label}</span>
        <div className="flex items-center gap-2">
          <span className="font-semibold" style={{ color: gap.color }}>{pct}%</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
            style={{ background: gap.bg, color: gap.color }}>{gap.label}</span>
        </div>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: gap.color }} />
      </div>
    </div>
  )
}

// ── PAGE ──────────────────────────────────────────────────

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-5 text-3xl">
            📋
          </div>
          <h1 className="text-lg font-bold text-gray-900 mb-2">No Business Profile Found</h1>
          <p className="text-sm text-gray-500 mb-6">
            Complete your business profile to get started with your diagnostic assessment.
          </p>
          <Link href="/onboarding"
            className="inline-block px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors">
            Complete Profile
          </Link>
        </div>
      </div>
    )
  }

  const diagnostics = await Diagnostic.find({ businessId: business._id })
    .sort({ createdAt: -1 })
    .lean() as any[]

  // Fetch tenant for diagnostic URL slug
  const tenant = await Tenant.findById(business.tenantId).lean() as any

  // No diagnostics empty state
  if (diagnostics.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5 text-3xl">
            🎯
          </div>
          <h1 className="text-lg font-bold text-gray-900 mb-2">No Diagnostics Yet</h1>
          <p className="text-sm text-gray-500 mb-6">
            Take your first business diagnostic to understand your investment readiness and get personalised recommendations.
          </p>
          {tenant?.slug && (
            <Link href={`/diagnostic/${tenant.slug}`}
              className="inline-block px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors">
              Take Your First Diagnostic
            </Link>
          )}
        </div>
      </div>
    )
  }

  const latest  = diagnostics[0]
  const result  = latest?.result ?? null
  const idx     = result?.lendabilityIndex ?? 0
  const cls     = result?.classification   ?? 'high_risk'
  const strat   = result?.strategic?.percentage ?? 0
  const proc    = (result?.process ?? result?.operational)?.percentage ?? 0
  const supp    = result?.support?.percentage ?? 0

  const taPrograms = await TAProgramme.find({ businessId: business._id })
    .sort({ createdAt: -1 })
    .lean() as any[]

  // ── Next Step CTA ──
  let ctaTitle   = ''
  let ctaBody    = ''
  let ctaBg      = ''
  let ctaBorder  = ''
  let ctaColor   = ''

  if (cls === 'high_risk') {
    ctaTitle  = 'Development Programme Required'
    ctaBody   = 'Your bank will contact you to start a development programme designed to address your key capacity gaps. This is the first step towards becoming investment ready.'
    ctaBg     = '#FCEBEB'; ctaBorder = '#FECACA'; ctaColor = '#A32D2D'
  } else if (cls === 'conditionally_lendable') {
    ctaTitle  = 'Complete Your TA Programme'
    ctaBody   = 'Complete your Technical Assistance programme to reach Investment Ready status. Addressing your identified gaps will improve your lendability index and unlock access to finance.'
    ctaBg     = '#FAEEDA'; ctaBorder = '#FDE68A'; ctaColor = '#BA7517'
  } else {
    ctaTitle  = 'You Are Eligible for a Loan'
    ctaBody   = 'Congratulations - you are eligible to apply for a loan. Contact your bank today to proceed with a credit appraisal. Your investment readiness score demonstrates strong business capacity.'
    ctaBg     = '#E1F5EE'; ctaBorder = '#A7F3D0'; ctaColor = '#0F6E56'
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">

      <div>
        <h1 className="text-xl font-bold text-gray-900">My Business Progress</h1>
        <p className="text-sm text-gray-500 mt-1">{business.name}</p>
      </div>

      {/* ── 1. Hero Score ── */}
      {result && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-6">
          <ScoreCircle index={idx} />
          <div>
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1">Lendability Index</p>
            <p className="text-lg font-bold mb-1" style={{ color: indexColor(idx) }}>{classLabel(cls)}</p>
            <p className="text-xs text-gray-400">Latest assessment: {formatDate(latest.createdAt)}</p>
            <p className="text-xs text-gray-400 mt-0.5">Period: {latest.period}</p>
          </div>
        </div>
      )}

      {/* ── 2. Capacity Levels ── */}
      {result && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Capacity Levels</h2>
          <CapacityBar label="Strategic Capacity" pct={strat} />
          <CapacityBar label="Process / Operational Capacity" pct={proc} />
          <CapacityBar label="Support Capacity" pct={supp} />
        </div>
      )}

      {/* ── 3. 12-Area Breakdown (accordion) ── */}
      {result?.areaScores?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">12-Area Breakdown</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {result.areaScores
              .slice()
              .sort((a: any, b: any) => a.areaNumber - b.areaNumber)
              .map((area: any) => {
                const gap = classifyGap(area.percentage)
                return (
                  <details key={area.areaKey} className="group">
                    <summary className="px-6 py-3.5 flex items-center justify-between cursor-pointer list-none hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-gray-100 text-[10px] font-semibold text-gray-500 flex items-center justify-center flex-shrink-0">
                          {area.areaNumber}
                        </span>
                        <span className="text-sm font-medium text-gray-700">{area.areaName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: gap.bg, color: gap.color }}>{gap.label}</span>
                        <span className="text-sm font-bold" style={{ color: gap.color }}>{area.percentage}%</span>
                        <svg className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </summary>
                    <div className="px-6 pb-4 pt-2 bg-gray-50">
                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                        <span>Score: <strong className="text-gray-700">{area.rawScore} / {area.maxScore}</strong></span>
                        <span>Level: <strong className="text-gray-700 capitalize">{area.level}</strong></span>
                      </div>
                      {area.parameterScores?.length > 0 && (
                        <div className="space-y-1.5">
                          {area.parameterScores.map((p: any) => {
                            const pg = classifyGap(p.score)
                            return (
                              <div key={p.parameterId} className="flex items-center justify-between text-xs">
                                <span className="text-gray-600">{p.parameterName}</span>
                                <span className="px-2 py-0.5 rounded-full font-medium"
                                  style={{ background: pg.bg, color: pg.color }}>{p.gapClassification}</span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </details>
                )
              })}
          </div>
        </div>
      )}

      {/* ── 4. Diagnostic History ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">Assessment History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Date', 'Period', 'Index', 'Classification'].map(h => (
                  <th key={h} className="px-5 py-2.5 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {diagnostics.map((d: any) => {
                const r  = d.result
                const di = r?.lendabilityIndex ?? '-'
                const dc = r?.classification   ?? '-'
                const gap = r ? classifyGap(Number(di)) : null
                return (
                  <tr key={String(d._id)} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3 text-sm text-gray-500">{formatDate(d.createdAt)}</td>
                    <td className="px-5 py-3 text-sm text-gray-500">{d.period}</td>
                    <td className="px-5 py-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider" style={{ background: r ? indexColor(Number(di)) + '15' : 'transparent', color: r ? indexColor(Number(di)) : '#6B7280' }}>
                        {di !== '-' ? `${di}%` : '-'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {dc !== '-' ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: indexColor(Number(di)) }} />
                          <span className="text-xs font-medium text-gray-700">{classLabel(dc)}</span>
                        </div>
                      ) : <span className="text-gray-400">-</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 5. TA Programmes ── */}
      {taPrograms.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">My Development Programmes</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {taPrograms.map((tp: any) => (
              <div key={String(tp._id)} className="px-6 py-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{tp.area}</p>
                    <p className="text-xs text-gray-400 mt-0.5 capitalize">{tp.capacityLevel} · {tp.timeframeWeeks} weeks</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold capitalize"
                    style={{
                      background: tp.status === 'completed' ? '#E1F5EE' : tp.status === 'active' ? '#EFF6FF' : '#F9FAFB',
                      color:      tp.status === 'completed' ? '#0F6E56' : tp.status === 'active' ? '#1D4ED8' : '#6B7280',
                    }}>
                    {tp.status}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-2 rounded-full transition-all"
                    style={{
                      width: `${tp.progressPercent}%`,
                      background: tp.status === 'completed' ? '#0F6E56' : '#185FA5',
                    }} />
                </div>
                <p className="text-[10px] text-gray-400 mt-1 text-right">{tp.progressPercent}% complete</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 5b. Personal Investment Readiness Funnel ── */}
      {result && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">Your Investment Readiness Journey</h2>
          <p className="text-xs text-gray-400 mb-4">Your current position in the investment readiness process</p>
          <div className="max-w-xs mx-auto">
            <BankFunnel
              stats={{
                formsSent:           1,
                diagnosticsComplete: diagnostics.length > 0 ? 1 : 0,
                scored60Plus:        idx >= 60 ? 1 : 0,
                taStarted:           taPrograms.filter((t: any) => t.status === 'active').length > 0 ? 1 : 0,
                loanApproved:        cls === 'investment_ready' ? 1 : 0,
              }}
              height={220}
              showConversion={false}
            />
          </div>
          <div className="mt-3 grid grid-cols-5 text-center text-[9px] text-gray-400 gap-1">
            {[
              'Link received',
              'Diagnostic done',
              'Score 60%+',
              'TA started',
              'Loan ready',
            ].map(l => <span key={l}>{l}</span>)}
          </div>
        </div>
      )}

      {/* ── 6. Next Step CTA ── */}
      <div className="rounded-2xl border p-6"
        style={{ background: ctaBg, borderColor: ctaBorder }}>
        <h2 className="text-sm font-bold mb-2" style={{ color: ctaColor }}>{ctaTitle}</h2>
        <p className="text-sm leading-relaxed" style={{ color: ctaColor }}>{ctaBody}</p>
        {tenant?.slug && cls !== 'high_risk' && (
          <Link href={`/diagnostic/${tenant.slug}`}
            className="inline-block mt-4 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
            style={{ background: ctaColor }}>
            Retake Diagnostic
          </Link>
        )}
      </div>

    </div>
  )
}
