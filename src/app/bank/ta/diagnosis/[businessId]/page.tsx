// src/app/bank/ta/diagnosis/[businessId]/page.tsx
// TA Needs Diagnosis - full capacity breakdown + TA recommendations
// Server component (chart interactions handled via styled divs, no client lib needed)

import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { connectDB } from '@/lib/db'
import { User, Tenant, Business, Diagnostic, TAProgramme } from '@/models'
import Link from 'next/link'
import type { AreaScore, ParameterScore, TARecommendation, GapClassification } from '@/types'
import { CAPACITY_AREAS, LEVEL_MAX } from '@/types'

// ── GAP HELPERS ───────────────────────────────────────────

function gapLabel(gap: GapClassification | string): string {
  return {
    high_priority_gap: 'High Priority Gap',
    low_priority_gap:  'Low Priority Gap',
    ideal_performance: 'Ideal Performance',
  }[gap as GapClassification] ?? gap
}

function gapColors(gap: GapClassification | string): { text: string; bg: string } {
  return {
    high_priority_gap: { text: '#A32D2D', bg: '#FCEBEB' },
    low_priority_gap:  { text: '#BA7517', bg: '#FAEEDA' },
    ideal_performance: { text: '#0F6E56', bg: '#E1F5EE' },
  }[gap as GapClassification] ?? { text: '#374151', bg: '#F3F4F6' }
}

function GapBadge({ gap }: { gap: GapClassification | string }) {
  const { text, bg } = gapColors(gap)
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ color: text, background: bg }}
    >
      {gapLabel(gap)}
    </span>
  )
}

function classificationLabel(c: string): string {
  return {
    investment_ready:       'Investment Ready',
    conditionally_lendable: 'Conditionally Lendable',
    high_risk:              'High Risk',
  }[c] ?? c
}

function classificationColors(c: string): { text: string; bg: string } {
  return {
    investment_ready:       { text: '#0F6E56', bg: '#E1F5EE' },
    conditionally_lendable: { text: '#BA7517', bg: '#FAEEDA' },
    high_risk:              { text: '#A32D2D', bg: '#FCEBEB' },
  }[c] ?? { text: '#374151', bg: '#F3F4F6' }
}

function formatDate(d: Date | string | undefined | null): string {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

// Priority badge for TA recommendations
function priorityBadge(priority: string) {
  const map: Record<string, { text: string; bg: string }> = {
    critical: { text: '#A32D2D', bg: '#FCEBEB' },
    high:     { text: '#C04A00', bg: '#FEF0E4' },
    medium:   { text: '#78350F', bg: '#FEFCE8' },
    low:      { text: '#374151', bg: '#F3F4F6' },
  }
  const colors = map[priority] ?? map.medium
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize"
      style={{ color: colors.text, background: colors.bg }}
    >
      {priority}
    </span>
  )
}

// ── SCORE PROGRESS BAR ────────────────────────────────────

function ScoreBar({ score, max, color }: { score: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((score / max) * 100)) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs text-gray-500 w-8 text-right">{pct}%</span>
    </div>
  )
}

// ── GAP SCALE LEGEND ──────────────────────────────────────

function GapScaleLegend() {
  return (
    <div className="mb-6">
      <p className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">Gap Score Scale</p>
      <div className="flex rounded-lg overflow-hidden border border-gray-200 text-xs font-medium h-8">
        <div className="flex-1 flex items-center justify-center" style={{ background: '#FCEBEB', color: '#A32D2D' }}>
          0 – 49% · High Priority Gap
        </div>
        <div className="flex-1 flex items-center justify-center border-x border-gray-200" style={{ background: '#FAEEDA', color: '#BA7517' }}>
          50 – 79% · Low Priority Gap
        </div>
        <div className="flex-1 flex items-center justify-center" style={{ background: '#E1F5EE', color: '#0F6E56' }}>
          80 – 100% · Ideal Performance
        </div>
      </div>
    </div>
  )
}

// ── CAPACITY LEVEL SECTION ────────────────────────────────

function CapacitySection({
  title,
  levelKey,
  areas,
  levelScore,
  levelMax,
}: {
  title: string
  levelKey: string
  areas: AreaScore[]
  levelScore: number
  levelMax: number
}) {
  const levelPct = levelMax > 0 ? Math.min(100, Math.round((levelScore / levelMax) * 100)) : 0
  const levelGap: GapClassification = levelPct >= 80 ? 'ideal_performance' : levelPct >= 50 ? 'low_priority_gap' : 'high_priority_gap'
  const levelBarColor = levelGap === 'ideal_performance' ? '#0F6E56' : levelGap === 'low_priority_gap' ? '#BA7517' : '#A32D2D'

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-6">
      {/* Section header */}
      <div className="px-6 py-4 border-b border-gray-100" style={{ background: '#FAFAFA' }}>
        <h3 className="font-semibold text-gray-900 text-base">{title}</h3>
        <p className="text-xs text-gray-500 mt-0.5 capitalize">{levelKey} Capacity</p>
      </div>

      <div className="p-6 space-y-8">
        {areas.map(area => (
          <div key={area.areaKey}>
            {/* Area header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-2">
                  Area {area.areaNumber}
                </span>
                <span className="font-semibold text-gray-800">{area.areaName}</span>
              </div>
              <GapBadge gap={area.gapClassification} />
            </div>

            {/* Parameters table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 font-medium border-b border-gray-100">
                    <th className="pb-2 pr-4">Parameter</th>
                    <th className="pb-2 pr-4 text-center w-20">Score (0–10)</th>
                    <th className="pb-2 pr-4 w-36">Gap</th>
                    <th className="pb-2">Aspects Assessed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {area.parameterScores.map((param: ParameterScore) => {
                    // Get aspects from CAPACITY_AREAS definition
                    const areaDef  = CAPACITY_AREAS.find(a => a.key === area.areaKey)
                    const paramDef = areaDef?.parameters.find(p => p.id === param.parameterId)
                    const aspects  = paramDef?.aspects ?? '-'
                    const { text: gt, bg: gbg } = gapColors(param.gapClassification)

                    return (
                      <tr key={param.parameterId} className="align-top">
                        <td className="py-2.5 pr-4 font-medium text-gray-800 whitespace-nowrap">{param.parameterName}</td>
                        <td className="py-2.5 pr-4 text-center">
                          <span
                            className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold"
                            style={{ background: gbg, color: gt }}
                          >
                            {param.score}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4">
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ color: gt, background: gbg }}
                          >
                            {gapLabel(param.gapClassification)}
                          </span>
                        </td>
                        <td className="py-2.5 text-xs text-gray-500 leading-relaxed">{aspects}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Area subtotal bar */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-gray-500 font-medium">
                  Area total: {area.rawScore} / {area.maxScore} pts
                </span>
                <span className="text-xs font-semibold" style={{ color: gapColors(area.gapClassification).text }}>
                  {area.percentage}%
                </span>
              </div>
              <ScoreBar score={area.rawScore} max={area.maxScore} color={gapColors(area.gapClassification).text} />
            </div>
          </div>
        ))}

        {/* Level total */}
        <div className="pt-4 border-t-2 border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-gray-900 capitalize">{levelKey} Total</span>
              <span className="text-sm text-gray-500 ml-2">{levelScore} / {levelMax} pts</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold" style={{ color: levelBarColor }}>{levelPct}%</span>
              <GapBadge gap={levelGap} />
            </div>
          </div>
          <div className="mt-2">
            <ScoreBar score={levelScore} max={levelMax} color={levelBarColor} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── PAGE ──────────────────────────────────────────────────

export default async function TADiagnosisPage({
  params,
  searchParams,
}: {
  params: { businessId: string }
  searchParams?: { ta?: string; error?: string }
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  await connectDB()
  const user   = await User.findOne({ clerkId: userId }).lean() as any
  if (!user) redirect('/onboarding')
  const tenant = await Tenant.findById(user.tenantId).lean() as any
  if (!tenant) redirect('/onboarding')

  const tenantId = user.tenantId.toString()

  // Validate businessId and verify it belongs to this tenant
  let business: any
  try {
    business = await Business.findById(params.businessId).lean()
  } catch {
    notFound()
  }
  if (!business || business.tenantId.toString() !== tenantId) notFound()

  // Most recent scored diagnostic for this business
  const diagnostic = await Diagnostic.findOne({
    tenantId,
    businessId: params.businessId,
    status: { $in: ['scored', 'reported'] },
  })
    .sort({ createdAt: -1 })
    .lean() as any
  const existingProgrammes = diagnostic
    ? await TAProgramme.countDocuments({
        tenantId,
        businessId: params.businessId,
        diagnosticId: diagnostic._id,
      })
    : 0

  const theme  = tenant.theme
  const result = diagnostic?.result

  // Gather area scores from result
  const areaScores: AreaScore[] = result?.areaScores ?? []

  // Split by level
  const strategicAreas = areaScores.filter(a => a.level === 'strategic')
  const processAreas   = areaScores.filter(a => a.level === 'process')
  const supportAreas   = areaScores.filter(a => a.level === 'support')

  // Level totals
  const strategicScore = strategicAreas.reduce((s, a) => s + a.rawScore, 0)
  const processScore   = processAreas.reduce((s, a) => s + a.rawScore, 0)
  const supportScore   = supportAreas.reduce((s, a) => s + a.rawScore, 0)

  // Summary table rows (one per area, grouped by level)
  function summaryRows(areas: AreaScore[]) {
    return areas.map(a => ({
      areaName:          a.areaName,
      areaNumber:        a.areaNumber,
      maxPoints:         a.maxScore,
      score:             a.rawScore,
      pct:               a.percentage,
      gapClassification: a.gapClassification,
    }))
  }

  // TA recommendations grouped by priority
  const taRecs: TARecommendation[] = result?.taRecommendations ?? []
  const priorityOrder = ['critical', 'high', 'medium', 'low'] as const
  const recsByPriority = priorityOrder.reduce((acc, p) => {
    acc[p] = taRecs.filter(r => r.priority === p)
    return acc
  }, {} as Record<string, TARecommendation[]>)

  const lendabilityIndex = result?.lendabilityIndex ?? null
  const classification   = result?.classification ?? null
  const classColors      = classification ? classificationColors(classification) : null
  const taStatus         = searchParams?.ta ?? null
  const taError          = searchParams?.error ?? null

  return (
    <div className="p-8 max-w-7xl mx-auto">

      {taStatus === 'created' && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          TA programme created successfully. The recommendations are now tracked in the TA portfolio.
        </div>
      )}
      {taStatus === 'exists' && (
        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          A TA programme has already been created for this diagnostic.
        </div>
      )}
      {taError === 'no-recommendations' && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          This diagnostic does not have TA recommendations to convert into a programme.
        </div>
      )}
      {taError === 'diagnostic-not-found' && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          The diagnostic record for this TA creation request could not be found.
        </div>
      )}

      {/* Back link */}
      <div className="mb-6">
        <Link
          href="/bank/ta"
          className="text-xs font-medium text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          ← Back to TA Programmes
        </Link>
      </div>

      {/* ── SECTION A: OVERVIEW ─────────────────────────────── */}
      <div className="mb-8">

        {/* Business header */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white"
                  style={{ background: theme.primary }}
                >
                  {business.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{business.name}</h1>
                  <p className="text-xs text-gray-500">CEO: {business.ceoName}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500 mt-3">
                <span>{business.sector}</span>
                {business.location && <span>· {business.location}</span>}
                {business.employeeCount && <span>· {business.employeeCount} employees</span>}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-gray-400 mb-1">Diagnosis Date</p>
              <p className="text-sm font-medium text-gray-700">{formatDate(diagnostic?.scoredAt ?? diagnostic?.createdAt)}</p>
              {lendabilityIndex !== null && (
                <div className="mt-3">
                  <p className="text-3xl font-bold" style={{ color: classColors?.text }}>
                    {lendabilityIndex}%
                  </p>
                  <span
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1"
                    style={{ color: classColors?.text, background: classColors?.bg }}
                  >
                    {classificationLabel(classification!)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Gap scale legend */}
        <GapScaleLegend />

        {/* No diagnostic state */}
        {!diagnostic && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
            <p className="text-sm font-medium text-amber-800 mb-1">No scored diagnostic found for this business</p>
            <p className="text-xs text-amber-600">Ask the SME to complete their diagnostic, then score it from the Submissions page.</p>
          </div>
        )}

        {/* Old data / no areaScores state */}
        {diagnostic && areaScores.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
            <p className="text-sm font-medium text-amber-800 mb-1">Area scores not available</p>
            <p className="text-xs text-amber-600">
              This diagnostic was scored with an older engine that did not record individual area scores.
              Please ask the SME to re-submit and re-score to view the full breakdown.
            </p>
          </div>
        )}

        {/* Summary overview table */}
        {areaScores.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Section A - Capacity Summary</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 font-medium border-b border-gray-100 bg-gray-50">
                    <th className="px-6 py-3">#</th>
                    <th className="px-4 py-3">Capacity Area</th>
                    <th className="px-4 py-3 text-right">Max Pts</th>
                    <th className="px-4 py-3 text-right">Score</th>
                    <th className="px-4 py-3 text-right">%</th>
                    <th className="px-4 py-3">Gap Classification</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Strategic */}
                  <tr className="bg-indigo-50/30">
                    <td colSpan={6} className="px-6 py-2 text-xs font-bold text-indigo-700 uppercase tracking-wider">
                      Strategic Capacity
                    </td>
                  </tr>
                  {summaryRows(strategicAreas).map(row => {
                    const { text: gt, bg: gbg } = gapColors(row.gapClassification)
                    return (
                      <tr key={row.areaNumber} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="px-6 py-3 text-gray-400 text-xs">{row.areaNumber}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{row.areaName}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{row.maxPoints}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-800">{row.score}</td>
                        <td className="px-4 py-3 text-right font-semibold" style={{ color: gt }}>{row.pct}%</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ color: gt, background: gbg }}>
                            {gapLabel(row.gapClassification)}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                  {/* Strategic total */}
                  <tr className="bg-indigo-50/50 font-semibold border-b border-indigo-100">
                    <td colSpan={2} className="px-6 py-2.5 text-xs text-indigo-700 uppercase">Strategic Total</td>
                    <td className="px-4 py-2.5 text-right text-indigo-700">{LEVEL_MAX.strategic}</td>
                    <td className="px-4 py-2.5 text-right text-indigo-700">{strategicScore}</td>
                    <td className="px-4 py-2.5 text-right text-indigo-700">
                      {Math.round((strategicScore / LEVEL_MAX.strategic) * 100)}%
                    </td>
                    <td className="px-4 py-2.5">
                      <GapBadge gap={result?.strategic?.gapClassification ?? (strategicScore / LEVEL_MAX.strategic >= 0.8 ? 'ideal_performance' : strategicScore / LEVEL_MAX.strategic >= 0.5 ? 'low_priority_gap' : 'high_priority_gap')} />
                    </td>
                  </tr>

                  {/* Process */}
                  <tr className="bg-blue-50/30">
                    <td colSpan={6} className="px-6 py-2 text-xs font-bold text-blue-700 uppercase tracking-wider">
                      Process Capacity
                    </td>
                  </tr>
                  {summaryRows(processAreas).map(row => {
                    const { text: gt, bg: gbg } = gapColors(row.gapClassification)
                    return (
                      <tr key={row.areaNumber} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="px-6 py-3 text-gray-400 text-xs">{row.areaNumber}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{row.areaName}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{row.maxPoints}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-800">{row.score}</td>
                        <td className="px-4 py-3 text-right font-semibold" style={{ color: gt }}>{row.pct}%</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ color: gt, background: gbg }}>
                            {gapLabel(row.gapClassification)}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                  {/* Process total */}
                  <tr className="bg-blue-50/50 font-semibold border-b border-blue-100">
                    <td colSpan={2} className="px-6 py-2.5 text-xs text-blue-700 uppercase">Process Total</td>
                    <td className="px-4 py-2.5 text-right text-blue-700">{LEVEL_MAX.process}</td>
                    <td className="px-4 py-2.5 text-right text-blue-700">{processScore}</td>
                    <td className="px-4 py-2.5 text-right text-blue-700">
                      {Math.round((processScore / LEVEL_MAX.process) * 100)}%
                    </td>
                    <td className="px-4 py-2.5">
                      <GapBadge gap={result?.process?.gapClassification ?? (processScore / LEVEL_MAX.process >= 0.8 ? 'ideal_performance' : processScore / LEVEL_MAX.process >= 0.5 ? 'low_priority_gap' : 'high_priority_gap')} />
                    </td>
                  </tr>

                  {/* Support */}
                  <tr className="bg-emerald-50/30">
                    <td colSpan={6} className="px-6 py-2 text-xs font-bold text-emerald-700 uppercase tracking-wider">
                      Support Capacity
                    </td>
                  </tr>
                  {summaryRows(supportAreas).map(row => {
                    const { text: gt, bg: gbg } = gapColors(row.gapClassification)
                    return (
                      <tr key={row.areaNumber} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="px-6 py-3 text-gray-400 text-xs">{row.areaNumber}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{row.areaName}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{row.maxPoints}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-800">{row.score}</td>
                        <td className="px-4 py-3 text-right font-semibold" style={{ color: gt }}>{row.pct}%</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ color: gt, background: gbg }}>
                            {gapLabel(row.gapClassification)}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                  {/* Support total */}
                  <tr className="bg-emerald-50/50 font-semibold border-b border-emerald-100">
                    <td colSpan={2} className="px-6 py-2.5 text-xs text-emerald-700 uppercase">Support Total</td>
                    <td className="px-4 py-2.5 text-right text-emerald-700">{LEVEL_MAX.support}</td>
                    <td className="px-4 py-2.5 text-right text-emerald-700">{supportScore}</td>
                    <td className="px-4 py-2.5 text-right text-emerald-700">
                      {Math.round((supportScore / LEVEL_MAX.support) * 100)}%
                    </td>
                    <td className="px-4 py-2.5">
                      <GapBadge gap={result?.support?.gapClassification ?? (supportScore / LEVEL_MAX.support >= 0.8 ? 'ideal_performance' : supportScore / LEVEL_MAX.support >= 0.5 ? 'low_priority_gap' : 'high_priority_gap')} />
                    </td>
                  </tr>

                  {/* Grand total */}
                  <tr className="bg-gray-100 font-bold text-gray-900">
                    <td colSpan={2} className="px-6 py-3 text-sm">Grand Total</td>
                    <td className="px-4 py-3 text-right text-sm">
                      {LEVEL_MAX.strategic + LEVEL_MAX.process + LEVEL_MAX.support}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      {strategicScore + processScore + supportScore}
                    </td>
                    <td className="px-4 py-3 text-right text-sm" style={{ color: classColors?.text ?? '#374151' }}>
                      {lendabilityIndex !== null ? `${lendabilityIndex}%` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      {classification && (
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={{ color: classColors?.text, background: classColors?.bg }}
                        >
                          {classificationLabel(classification)}
                        </span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── SECTIONS B, C, D: DETAILED CAPACITY BREAKDOWNS ─── */}
      {areaScores.length > 0 && (
        <>
          {/* Section B - Strategic */}
          <div className="mb-2">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Section B - Strategic Capacity</h2>
          </div>
          <CapacitySection
            title="Strategic Capacity Breakdown"
            levelKey="strategic"
            areas={strategicAreas}
            levelScore={strategicScore}
            levelMax={LEVEL_MAX.strategic}
          />

          {/* Section C - Process */}
          <div className="mb-2">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Section C - Process Capacity</h2>
          </div>
          <CapacitySection
            title="Process Capacity Breakdown"
            levelKey="process"
            areas={processAreas}
            levelScore={processScore}
            levelMax={LEVEL_MAX.process}
          />

          {/* Section D - Support */}
          <div className="mb-2">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Section D - Support Capacity</h2>
          </div>
          <CapacitySection
            title="Support Capacity Breakdown"
            levelKey="support"
            areas={supportAreas}
            levelScore={supportScore}
            levelMax={LEVEL_MAX.support}
          />
        </>
      )}

      {/* ── SECTION E: TA RECOMMENDATIONS ──────────────────── */}
      {areaScores.length > 0 && (
        <div className="mt-2">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Section E - TA Recommendations</h2>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100" style={{ background: '#FAFAFA' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Technical Assistance Plan</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {taRecs.length} area{taRecs.length !== 1 ? 's' : ''} identified for capacity building
                  </p>
                </div>
                {result?.projectedIndexAfterTA !== undefined && (
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Projected Index After TA</p>
                    <p className="text-2xl font-bold text-emerald-700">{result.projectedIndexAfterTA}%</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6">
              {taRecs.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3 text-2xl">
                    ✓
                  </div>
                  <p className="font-semibold text-emerald-700 mb-1">Excellent Performance</p>
                  <p className="text-xs text-gray-500">All parameters score 8/10 or above. No TA interventions required.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {priorityOrder.map(priority => {
                    const recs = recsByPriority[priority]
                    if (!recs || recs.length === 0) return null
                    const { text: pt, bg: pbg } = gapColors(
                      priority === 'critical' || priority === 'high' ? 'high_priority_gap' :
                      priority === 'medium' ? 'low_priority_gap' : 'ideal_performance'
                    )
                    const priorityColors: Record<string, { text: string; bg: string; border: string }> = {
                      critical: { text: '#A32D2D', bg: '#FCEBEB', border: '#F5C6C6' },
                      high:     { text: '#C04A00', bg: '#FEF0E4', border: '#FCCFAD' },
                      medium:   { text: '#78350F', bg: '#FEFCE8', border: '#FDE68A' },
                      low:      { text: '#374151', bg: '#F9FAFB', border: '#E5E7EB' },
                    }
                    const pc = priorityColors[priority]

                    return (
                      <div key={priority}>
                        {/* Priority group header */}
                        <div className="flex items-center gap-3 mb-4">
                          <span
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide"
                            style={{ color: pc.text, background: pc.bg, border: `1px solid ${pc.border}` }}
                          >
                            {priority} Priority
                          </span>
                          <span className="text-xs text-gray-400">{recs.length} area{recs.length !== 1 ? 's' : ''}</span>
                          <div className="flex-1 h-px bg-gray-100" />
                        </div>

                        {/* Recommendation cards */}
                        <div className="grid gap-4 md:grid-cols-2">
                          {recs.map((rec: TARecommendation, i: number) => {
                            const scorePct = (rec.currentScore / 10) * 100
                            const scoreGap: GapClassification = scorePct >= 80 ? 'ideal_performance' : scorePct >= 50 ? 'low_priority_gap' : 'high_priority_gap'
                            const { text: st, bg: sbg } = gapColors(scoreGap)

                            return (
                              <div
                                key={`${rec.parameterId ?? rec.area}-${i}`}
                                className="rounded-xl border p-4"
                                style={{ borderColor: pc.border, background: `${pc.bg}60` }}
                              >
                                {/* Card header */}
                                <div className="flex items-start justify-between gap-2 mb-3">
                                  <p className="font-semibold text-gray-900 text-sm leading-snug">{rec.area}</p>
                                  <div className="flex-shrink-0 flex items-center gap-1">
                                    <span
                                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold"
                                      style={{ color: st, background: sbg }}
                                    >
                                      {rec.currentScore}/10
                                    </span>
                                    <span className="text-xs text-gray-400">→</span>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
                                      {rec.targetScore}/10
                                    </span>
                                  </div>
                                </div>

                                {/* Score bar */}
                                <div className="mb-3">
                                  <div className="flex h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full"
                                      style={{ width: `${(rec.currentScore / 10) * 100}%`, background: st }}
                                    />
                                    <div
                                      className="h-full rounded-full opacity-30"
                                      style={{
                                        width: `${((rec.targetScore - rec.currentScore) / 10) * 100}%`,
                                        background: '#0F6E56',
                                      }}
                                    />
                                  </div>
                                </div>

                                {/* Recommendation text */}
                                <p className="text-xs text-gray-700 mb-3 leading-relaxed">{rec.recommendation}</p>

                                {/* Tools */}
                                {rec.tools && rec.tools.length > 0 && (
                                  <div className="mb-3">
                                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Tools & Resources</p>
                                    <div className="flex flex-wrap gap-1">
                                      {rec.tools.map(tool => (
                                        <span
                                          key={tool}
                                          className="px-2 py-0.5 rounded text-[10px] bg-white border border-gray-200 text-gray-600"
                                        >
                                          {tool}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Timeframe */}
                                <div className="flex items-center justify-between">
                                  <p className="text-[10px] text-gray-400">
                                    Timeframe: <span className="font-medium text-gray-600">{rec.timeframeWeeks} weeks</span>
                                  </p>
                                  <span className="capitalize text-[10px] text-gray-400">{rec.capacityLevel}</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Create TA Programme button */}
            {taRecs.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  {existingProgrammes > 0
                    ? 'This diagnostic already has tracked TA activities in the portfolio.'
                    : 'Creating a TA Programme will convert these recommendations into tracked activities.'}
                </p>
                {diagnostic && existingProgrammes === 0 ? (
                  <form action="/api/bank/ta" method="POST">
                    <input type="hidden" name="businessId" value={params.businessId} />
                    <input type="hidden" name="diagnosticId" value={String(diagnostic._id)} />
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-lg text-sm font-medium shadow-sm text-white hover:opacity-90"
                      style={{ background: theme.primary }}
                    >
                      Create TA Programme
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="px-5 py-2.5 rounded-lg text-sm font-medium shadow-sm border border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                  >
                    {existingProgrammes > 0 ? 'Programme Already Created' : 'Create TA Programme'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
