import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { connectDB } from '@/lib/db'
import { Business, Diagnostic, Tenant, User } from '@/models'
import type { AreaScore, TARecommendation } from '@/types'

function formatDate(date: Date | string | undefined | null): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function gapColors(percentage: number): { text: string; bg: string; label: string } {
  if (percentage >= 80) return { text: '#0F6E56', bg: '#E1F5EE', label: 'Ideal Performance' }
  if (percentage >= 50) return { text: '#BA7517', bg: '#FAEEDA', label: 'Low Priority Gap' }
  return { text: '#A32D2D', bg: '#FCEBEB', label: 'High Priority Gap' }
}

function classificationLabel(classification: string | null): string {
  return {
    investment_ready: 'Investment Ready',
    conditionally_lendable: 'Conditionally Lendable',
    high_risk: 'High Risk',
  }[classification ?? ''] ?? 'Pending'
}

export default async function SMEDiagnosticDetailPage({
  params,
}: {
  params: { diagnosticId: string }
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  await connectDB()

  const user = (await User.findOne({ clerkId: userId }).lean()) as any
  if (!user || user.role !== 'sme' || !user.businessId) redirect('/dashboard')

  const business = (await Business.findById(user.businessId).lean()) as any
  if (!business) redirect('/sme/diagnostics')

  const diagnostic = (await Diagnostic.findOne({
    _id: params.diagnosticId,
    businessId: business._id,
  }).lean()) as any
  if (!diagnostic) notFound()

  const tenant = business.tenantId ? ((await Tenant.findById(business.tenantId).lean()) as any) : null
  const themeColor = tenant?.theme?.primary ?? '#0F766E'
  const result = diagnostic.result
  const areaScores: AreaScore[] = result?.areaScores ?? []
  const recommendations: TARecommendation[] = result?.taRecommendations ?? []

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <Link href="/sme/diagnostics" className="text-xs font-medium text-gray-500 hover:text-gray-700">
          ← Back to My Diagnostics
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold text-white"
              style={{ background: themeColor }}
            >
              {business.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{business.name}</h1>
              <p className="text-sm text-gray-500">{tenant?.name ?? 'Diagnostic Report'}</p>
              <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                <span>{business.sector}</span>
                {business.location && <span>· {business.location}</span>}
                <span>· {formatDate(diagnostic.scoredAt ?? diagnostic.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:min-w-[260px]">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-[10px] uppercase tracking-wide text-gray-400">Lendability Index</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {result?.lendabilityIndex !== undefined ? `${result.lendabilityIndex}%` : '-'}
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-[10px] uppercase tracking-wide text-gray-400">Classification</p>
              <p className="text-sm font-semibold text-gray-900 mt-2">
                {classificationLabel(result?.classification ?? null)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {!result && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-amber-900">Report not ready yet</h2>
          <p className="text-sm text-amber-700 mt-1">
            Your assessment has been submitted, but scoring has not been completed yet.
          </p>
        </div>
      )}

      {result && areaScores.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-amber-900">Detailed breakdown unavailable</h2>
          <p className="text-sm text-amber-700 mt-1">
            This report was generated without the newer area-level breakdown data.
          </p>
        </div>
      )}

      {areaScores.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Capacity Area Breakdown</h2>
          </div>
          <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
            {areaScores.map((area) => {
              const gap = gapColors(area.percentage)

              return (
                <div key={area.areaKey} className="rounded-2xl border border-gray-100 p-5 bg-gray-50/60">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-gray-400">
                        Area {area.areaNumber} · {area.level}
                      </p>
                      <h3 className="text-sm font-semibold text-gray-900 mt-1">{area.areaName}</h3>
                    </div>
                    <span
                      className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap"
                      style={{ background: gap.bg, color: gap.text }}
                    >
                      {gap.label}
                    </span>
                  </div>

                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-bold" style={{ color: gap.text }}>
                        {area.percentage}%
                      </p>
                      <p className="text-xs text-gray-500">
                        {area.rawScore} / {area.maxScore} points
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${area.percentage}%`, background: gap.text }} />
                  </div>

                  <div className="mt-4 space-y-2">
                    {area.parameterScores.map((parameter) => (
                      <div key={`${area.areaKey}-${parameter.parameterId}`} className="flex items-start justify-between gap-3 text-xs">
                        <span className="text-gray-600">{parameter.parameterName}</span>
                        <span className="font-semibold text-gray-900 whitespace-nowrap">{parameter.score}/10</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {result && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Recommended Actions</h2>
          </div>
          <div className="p-6">
            {recommendations.length === 0 ? (
              <p className="text-sm text-gray-600">
                No urgent technical assistance actions were generated for this report.
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {recommendations.map((recommendation, index) => (
                  <div key={`${recommendation.parameterId ?? recommendation.area}-${index}`} className="rounded-2xl border border-gray-100 p-5 bg-gray-50/60">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{recommendation.area}</p>
                        <p className="text-xs text-gray-500 mt-1 capitalize">
                          {recommendation.capacityLevel} · {recommendation.priority} priority
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-gray-700 whitespace-nowrap">
                        {recommendation.currentScore}/10 → {recommendation.targetScore}/10
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-4">{recommendation.recommendation}</p>
                    <p className="text-xs text-gray-500 mt-3">
                      Suggested timeframe: {recommendation.timeframeWeeks} weeks
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
