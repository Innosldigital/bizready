// src/app/bank/sme/[businessId]/page.tsx
// Individual SME full profile page - server component

import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { connectDB } from '@/lib/db'
import { User, Business, Diagnostic, TAProgramme } from '@/models'

// ── HELPERS ───────────────────────────────────────────────

function classifyGap(pct: number) {
  if (pct >= 80) return { label: 'Ideal Performance', color: '#0F6E56', bg: '#E1F5EE' }
  if (pct >= 50) return { label: 'Low Priority Gap',  color: '#BA7517', bg: '#FAEEDA' }
  return           { label: 'High Priority Gap',  color: '#A32D2D', bg: '#FCEBEB' }
}

function formatDate(d: any) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function indexColor(idx: number) {
  if (idx >= 80) return '#0F6E56'
  if (idx >= 60) return '#BA7517'
  return '#A32D2D'
}

function classLabel(c: string) {
  if (c === 'investment_ready')      return 'Investment Ready'
  if (c === 'conditionally_lendable') return 'Conditionally Lendable'
  return 'High Risk'
}

function ScoreCircle({ index, size = 112 }: { index: number; size?: number }) {
  const color = indexColor(index)
  const r = (size / 2) - 8
  const circ = 2 * Math.PI * r
  const fill = (index / 100) * circ
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F3F4F6" strokeWidth="10" />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={`${fill} ${circ - fill}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x={size / 2} y={size / 2 - 6} textAnchor="middle" dominantBaseline="central"
        fontSize="22" fontWeight="700" fill={color}>{index}</text>
      <text x={size / 2} y={size / 2 + 14} textAnchor="middle" dominantBaseline="central"
        fontSize="10" fill="#6B7280">/ 100</text>
    </svg>
  )
}

function CapacityBar({ label, pct }: { label: string; pct: number }) {
  const { color } = classifyGap(pct)
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600 font-medium">{label}</span>
        <span className="font-semibold" style={{ color }}>{pct}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

function TaStatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    upcoming:  { bg: '#EFF6FF', color: '#1D4ED8' },
    active:    { bg: '#E1F5EE', color: '#0F6E56' },
    completed: { bg: '#F0FDF4', color: '#15803D' },
    paused:    { bg: '#FEF9C3', color: '#854D0E' },
  }
  const s = map[status] || { bg: '#F3F4F6', color: '#4B5563' }
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium capitalize"
      style={{ background: s.bg, color: s.color }}>{status}</span>
  )
}

// ── PAGE ──────────────────────────────────────────────────

export default async function SMEProfilePage({
  params,
}: {
  params: { businessId: string }
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  await connectDB()

  const user = await User.findOne({ clerkId: userId }).lean() as any
  if (!user || !['bank_admin', 'bank_staff'].includes(user.role)) redirect('/dashboard')

  const tenantId = user.tenantId

  const business = await Business.findById(params.businessId).lean() as any
  if (!business) notFound()
  if (String(business.tenantId) !== String(tenantId)) notFound()

  const diagnostics = await Diagnostic.find({ businessId: params.businessId })
    .sort({ createdAt: -1 })
    .lean() as any[]

  const latest = diagnostics[0] ?? null
  const result = latest?.result ?? null

  const taPrograms = await TAProgramme.find({ businessId: params.businessId })
    .sort({ createdAt: -1 })
    .lean() as any[]

  const idx   = result?.lendabilityIndex ?? 0
  const cls   = result?.classification   ?? 'high_risk'
  const strat = result?.strategic?.percentage  ?? 0
  const proc  = (result?.process ?? result?.operational)?.percentage ?? 0
  const supp  = result?.support?.percentage ?? 0

  // ── Bank Recommendation ──
  let recommendation = ''
  if (idx >= 80) {
    recommendation = 'Proceed with credit appraisal. This business has demonstrated investment-ready capacity across strategic, operational, and support dimensions. Risk exposure is low and the business is suitable for standard lending terms.'
  } else if (idx >= 60) {
    recommendation = 'Conditional lending recommended. This business shows moderate capacity but has identified gaps. Recommend enrolment in targeted TA intervention for high-priority areas, then reassessment within 90 days before final credit approval.'
  } else {
    recommendation = 'Enrol in TA programme before lending. This business presents significant capacity gaps that represent elevated credit risk. A structured Technical Assistance programme should be completed and the business re-assessed before any lending decision is considered.'
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Breadcrumb */}
      <nav className="text-xs text-gray-400 flex items-center gap-1.5">
        <Link href="/bank/sme" className="hover:text-gray-600">SME Portfolio</Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">{business.name}</span>
      </nav>

      {/* ── 1. Business Info Header ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">{business.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{business.sector} · {business.location || business.district || 'N/A'}</p>
          </div>
          {result && (
            <span className="px-3 py-1 rounded-full text-xs font-semibold"
              style={{ background: indexColor(idx) + '18', color: indexColor(idx) }}>
              {classLabel(cls)}
            </span>
          )}
        </div>
        <div className="px-6 py-5 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4">
          {[
            { label: 'CEO / Owner',   value: business.ceoName },
            { label: 'Industry',      value: business.sector || '-' },
            { label: 'Location',      value: [business.location, business.district, business.country].filter(Boolean).join(', ') || '-' },
            { label: 'Employees',     value: business.employeeCount || '-' },
            { label: 'Annual Revenue',value: business.annualRevenue || '-' },
            { label: 'Loan Purpose',  value: business.loanPurpose || '-' },
            { label: 'Phone',         value: business.phone || '-' },
            { label: 'Email',         value: business.email },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
              <p className="text-sm text-gray-800 font-medium">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 2. Score Summary ── */}
      {result ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-5">Lendability Score Summary</h2>
          <div className="flex items-center gap-8">
            <div className="flex flex-col items-center gap-2">
              <ScoreCircle index={idx} />
              <span className="text-xs font-medium" style={{ color: indexColor(idx) }}>{classLabel(cls)}</span>
            </div>
            <div className="flex-1 max-w-xs">
              <CapacityBar label="Strategic" pct={strat} />
              <CapacityBar label="Process / Operational" pct={proc} />
              <CapacityBar label="Support" pct={supp} />
            </div>
            {result.projectedIndexAfterTA != null && (
              <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Projected after TA</p>
                <p className="text-2xl font-bold" style={{ color: indexColor(result.projectedIndexAfterTA) }}>
                  {result.projectedIndexAfterTA}
                </p>
                <p className="text-[10px] text-gray-400 mt-1">index post-programme</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
          <p className="text-sm text-gray-500">No scored diagnostic available yet.</p>
        </div>
      )}

      {/* ── 3. 12-Area Breakdown ── */}
      {result?.areaScores?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">12-Area Capacity Breakdown</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['#', 'Area', 'Max Pts', 'Score', '%', 'Classification'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.areaScores
                  .slice()
                  .sort((a: any, b: any) => a.areaNumber - b.areaNumber)
                  .map((area: any) => {
                    const gap = classifyGap(area.percentage)
                    return (
                      <tr key={area.areaKey} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-400 font-medium">{area.areaNumber}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{area.areaName}</td>
                        <td className="px-4 py-3 text-gray-500">{area.maxScore}</td>
                        <td className="px-4 py-3 text-gray-700">{area.rawScore}</td>
                        <td className="px-4 py-3">
                          <span className="font-semibold" style={{ color: gap.color }}>{area.percentage}%</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                            style={{ background: gap.bg, color: gap.color }}>
                            {gap.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 4. Diagnostic History ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Diagnostic History</h2>
          <span className="text-xs text-gray-400">{diagnostics.length} assessment{diagnostics.length !== 1 ? 's' : ''}</span>
        </div>
        {diagnostics.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-gray-400">No diagnostics submitted yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Date', 'Period', 'Index', 'Strategic', 'Process', 'Support', 'Classification', ''].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {diagnostics.map((d: any) => {
                  const r = d.result
                  const di = r?.lendabilityIndex ?? '-'
                  const dc = r?.classification ?? '-'
                  const ds = r?.strategic?.percentage ?? '-'
                  const dp = (r?.process ?? r?.operational)?.percentage ?? '-'
                  const dsu = r?.support?.percentage ?? '-'
                  const gap = r ? classifyGap(Number(di)) : null
                  return (
                    <tr key={String(d._id)} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">{formatDate(d.createdAt)}</td>
                      <td className="px-4 py-3 text-gray-600">{d.period}</td>
                      <td className="px-4 py-3 font-semibold" style={{ color: r ? indexColor(Number(di)) : '#6B7280' }}>{di}</td>
                      <td className="px-4 py-3 text-gray-600">{ds}{ds !== '-' ? '%' : ''}</td>
                      <td className="px-4 py-3 text-gray-600">{dp}{dp !== '-' ? '%' : ''}</td>
                      <td className="px-4 py-3 text-gray-600">{dsu}{dsu !== '-' ? '%' : ''}</td>
                      <td className="px-4 py-3">
                        {gap ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                            style={{ background: gap.bg, color: gap.color }}>{classLabel(dc)}</span>
                        ) : <span className="text-gray-400">-</span>}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/bank/ta/diagnosis/${params.businessId}?diagnosticId=${d._id}`}
                          className="text-xs font-medium text-blue-600 hover:underline">
                          View
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 5. TA Programmes ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">TA Programmes</h2>
          <span className="text-xs text-gray-400">{taPrograms.length} programme{taPrograms.length !== 1 ? 's' : ''}</span>
        </div>
        {taPrograms.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-gray-400">No TA programmes assigned yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {taPrograms.map((tp: any) => (
              <div key={String(tp._id)} className="px-6 py-4 flex items-center gap-6">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{tp.area}</p>
                  <p className="text-xs text-gray-400 mt-0.5 capitalize">{tp.capacityLevel} · {tp.timeframeWeeks}w programme</p>
                </div>
                <div className="hidden sm:block text-xs text-gray-500">
                  {tp.startDate ? formatDate(tp.startDate) : <span className="text-gray-300">Not started</span>}
                </div>
                <div className="w-32">
                  <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                    <span>Progress</span><span>{tp.progressPercent}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-1.5 rounded-full bg-blue-500 transition-all"
                      style={{ width: `${tp.progressPercent}%` }} />
                  </div>
                </div>
                <TaStatusBadge status={tp.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 6. Bank Recommendation ── */}
      <div className="rounded-xl border p-5"
        style={{
          background: idx >= 80 ? '#E1F5EE' : idx >= 60 ? '#FAEEDA' : '#FCEBEB',
          borderColor: idx >= 80 ? '#A7F3D0' : idx >= 60 ? '#FDE68A' : '#FECACA',
        }}>
        <h2 className="text-sm font-semibold mb-2"
          style={{ color: idx >= 80 ? '#0F6E56' : idx >= 60 ? '#BA7517' : '#A32D2D' }}>
          Bank Recommendation
        </h2>
        <p className="text-sm" style={{ color: idx >= 80 ? '#065F46' : idx >= 60 ? '#78350F' : '#7F1D1D' }}>
          {recommendation}
        </p>
      </div>

      {/* ── 7. Assessor's Notes (read-only) ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Assessor&apos;s Notes</h2>
        <textarea
          readOnly
          defaultValue={latest?.notes ?? ''}
          placeholder="No assessor notes recorded. (Editing requires a client component.)"
          className="w-full min-h-[100px] text-sm text-gray-700 border border-gray-200 rounded-lg p-3 resize-none bg-gray-50 focus:outline-none"
        />
        <p className="text-[10px] text-gray-400 mt-1">Notes are read-only in this view. Edit functionality requires a client-side form component.</p>
      </div>

    </div>
  )
}
