// src/app/bank/submissions/page.tsx
// Server component - Submissions list with pagination, filters, and summary stats

import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { connectDB } from '@/lib/db'
import { User, Tenant, Business, Diagnostic } from '@/models'
import SubmissionsFilterBar from './SubmissionsFilterBar'

// ── TYPES ─────────────────────────────────────────────────
interface PageProps {
  searchParams: { page?: string; search?: string; classification?: string; sector?: string }
}

// ── GAP CLASSIFICATION ────────────────────────────────────
function classifyGap(pct: number) {
  if (pct >= 80) return { label: 'Ideal Performance', color: '#0F6E56', bg: '#E1F5EE' }
  if (pct >= 50) return { label: 'Low Priority Gap',  color: '#BA7517', bg: '#FAEEDA' }
  return           { label: 'High Priority Gap',  color: '#A32D2D', bg: '#FCEBEB' }
}

function classifyIndex(index: number) {
  if (index >= 80) return { label: 'Investment Ready',       color: '#0F6E56', bg: '#E1F5EE' }
  if (index >= 60) return { label: 'Conditionally Lendable', color: '#BA7517', bg: '#FAEEDA' }
  return           { label: 'High Risk',                     color: '#A32D2D', bg: '#FCEBEB' }
}

function taBadge(status: string) {
  if (status === 'active')    return { label: 'TA Active',    color: '#185FA5', bg: '#EBF2FB' }
  if (status === 'completed') return { label: 'TA Completed', color: '#0F6E56', bg: '#E1F5EE' }
  return                             { label: 'No TA',        color: '#6B7280', bg: '#F3F4F6' }
}

// ── METADATA (generated dynamically) ─────────────────────
export async function generateMetadata(): Promise<Metadata> {
  try {
    const { userId } = await auth()
    if (!userId) return { title: 'Submissions - BizReady' }
    await connectDB()
    const user = await User.findOne({ clerkId: userId }).lean() as any
    if (!user) return { title: 'Submissions - BizReady' }
    const tenant = await Tenant.findById(user.tenantId).lean() as any
    const bankName = tenant?.theme?.bankName || 'BizReady'
    return { title: `Submissions - ${bankName}` }
  } catch {
    return { title: 'Submissions - BizReady' }
  }
}

// ── PAGE CONSTANTS ────────────────────────────────────────
const PAGE_SIZE = 20

// ── PAGE COMPONENT ────────────────────────────────────────
export default async function SubmissionsPage({ searchParams }: PageProps) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  await connectDB()

  const user = await User.findOne({ clerkId: userId }).lean() as any
  if (!user) redirect('/onboarding')

  const tenantId = user.tenantId
  const tenant   = await Tenant.findById(tenantId).lean() as any
  if (!tenant) redirect('/onboarding')

  const theme    = tenant.theme
  const bankName = theme.bankName || 'BizReady'

  // ── PAGINATION & FILTERS ─────────────────────────────────
  const page           = Math.max(1, parseInt(searchParams.page || '1', 10))
  const skip           = (page - 1) * PAGE_SIZE
  const filterClassif  = searchParams.classification || ''
  const filterSector   = searchParams.sector || ''
  const filterSearch   = searchParams.search || ''

  // Build base query - always scoped to this tenant
  const baseQuery: Record<string, any> = {
    tenantId,
    status: { $in: ['submitted', 'scored', 'reported'] },
  }
  if (filterClassif) {
    baseQuery['result.classification'] = filterClassif
  }

  // Fetch all diagnostics for this tenant (populated with business)
  // We populate businessId to get name/CEO/sector for the table
  const [rawDiagnostics, totalCount] = await Promise.all([
    Diagnostic.find(baseQuery)
      .populate('businessId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(PAGE_SIZE)
      .lean(),
    Diagnostic.countDocuments(baseQuery),
  ])

  // Apply search & sector filter in JS (after populate) for simplicity
  const diagnostics = rawDiagnostics.filter((d: any) => {
    const biz = d.businessId as any
    if (!biz) return false
    if (filterSector && biz.sector !== filterSector) return false
    if (filterSearch) {
      const needle = filterSearch.toLowerCase()
      if (
        !biz.name?.toLowerCase().includes(needle) &&
        !biz.ceoName?.toLowerCase().includes(needle)
      ) return false
    }
    return true
  })

  // ── SUMMARY STATS (full tenant, no pagination filters) ──
  const allScored = await Diagnostic.find({
    tenantId,
    status: { $in: ['submitted', 'scored', 'reported'] },
    'result.lendabilityIndex': { $exists: true },
  }).select('result.lendabilityIndex result.classification').lean() as any[]

  const totalSubmissions = allScored.length
  const avgIndex = totalSubmissions > 0
    ? Math.round(allScored.reduce((s, d) => s + (d.result?.lendabilityIndex ?? 0), 0) / totalSubmissions)
    : 0
  const highRiskCount = allScored.filter(d => d.result?.classification === 'high_risk').length
  const readyCount    = allScored.filter(d => d.result?.classification === 'investment_ready').length

  // Unique sectors for filter dropdown
  const allBusinesses = await Business.find({ tenantId }).select('sector').lean() as any[]
  const sectors = Array.from(new Set(allBusinesses.map((b: any) => b.sector).filter(Boolean))).sort()

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  // ── EMPTY STATE ───────────────────────────────────────────
  if (totalSubmissions === 0) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Submissions</h1>
          <p className="text-sm text-gray-500 mt-1">{bankName} - Diagnostic results</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-9 h-9 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">No submissions yet</h2>
          <p className="text-sm text-gray-500 mb-8 max-w-md mx-auto">
            Share your diagnostic link with SME clients to collect their first business readiness assessment.
          </p>
          <div className="inline-flex items-center gap-3 px-6 py-4 bg-gray-50 rounded-xl border border-gray-100">
            <span className="text-xs font-medium text-gray-500">Your diagnostic link</span>
            <code className="text-sm font-mono text-gray-700 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
              {process.env.NEXT_PUBLIC_APP_URL || 'https://bizready.app'}/diagnostic/{tenant.slug}
            </code>
            <span
              className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white cursor-pointer hover:opacity-90 transition-opacity"
              style={{ background: theme.primary }}
            >
              Copy link
            </span>
          </div>
        </div>
      </div>
    )
  }

  // ── MAIN RENDER ───────────────────────────────────────────
  return (
    <div className="p-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Submissions</h1>
          <p className="text-sm text-gray-500 mt-1">{bankName} - {totalSubmissions} total diagnostic{totalSubmissions !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/bank/analytics"
          className="text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
        >
          View Analytics →
        </Link>
      </div>

      {/* Summary stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Submissions" value={String(totalSubmissions)} accent={theme.primary} />
        <StatCard label="Average Index"     value={`${avgIndex}%`}           accent={theme.primary} />
        <StatCard label="High Risk"         value={String(highRiskCount)}    accent="#A32D2D" />
        <StatCard label="Investment Ready"  value={String(readyCount)}       accent="#0F6E56" />
      </div>

      {/* Filter bar - client component */}
      <SubmissionsFilterBar
        sectors={sectors}
        currentSearch={filterSearch}
        currentClassification={filterClassif}
        currentSector={filterSector}
      />

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mt-4">
        {diagnostics.length === 0 ? (
          <div className="p-16 text-center text-sm text-gray-400">
            No results match your current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left">
                  <th className="px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Business</th>
                  <th className="px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">CEO</th>
                  <th className="px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Sector</th>
                  <th className="px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Date</th>
                  <th className="px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide text-right">Index</th>
                  <th className="px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide text-right">Strategic%</th>
                  <th className="px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide text-right">Process%</th>
                  <th className="px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide text-right">Support%</th>
                  <th className="px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Classification</th>
                  <th className="px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">TA Status</th>
                  <th className="px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {diagnostics.map((diag: any) => {
                  const biz    = diag.businessId as any
                  const result = diag.result
                  const index  = result?.lendabilityIndex ?? 0
                  const strat  = result?.strategic?.percentage  ?? 0
                  const proc   = (result?.process ?? result?.operational)?.percentage ?? 0
                  const supp   = result?.support?.percentage  ?? 0
                  const classif = classifyIndex(index)
                  const ta      = taBadge(biz?.taStatus || 'none')
                  const date    = diag.submittedAt || diag.createdAt
                  const dateStr = date
                    ? new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '-'

                  return (
                    <tr key={String(diag._id)} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <span className="font-semibold text-gray-900 line-clamp-1">{biz?.name || '-'}</span>
                      </td>
                      <td className="px-5 py-4 text-gray-600">{biz?.ceoName || '-'}</td>
                      <td className="px-5 py-4">
                        <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                          {biz?.sector || '-'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-500 whitespace-nowrap">{dateStr}</td>
                      <td className="px-5 py-4 text-right">
                        <span className="font-bold text-gray-900">{Math.round(index)}%</span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <ScorePill value={Math.round(strat)} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <ScorePill value={Math.round(proc)} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <ScorePill value={Math.round(supp)} />
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
                          style={{ color: classif.color, background: classif.bg }}
                        >
                          {classif.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap"
                          style={{ color: ta.color, background: ta.bg }}
                        >
                          {ta.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          href={`/bank/sme/${String(biz?._id)}`}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg border text-gray-600 border-gray-200 bg-white hover:bg-gray-50 transition-colors whitespace-nowrap"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
            <span className="text-xs text-gray-500">
              Showing {skip + 1}-{Math.min(skip + PAGE_SIZE, totalCount)} of {totalCount}
            </span>
            <div className="flex gap-2">
              {page > 1 && (
                <PaginationLink href={buildPageUrl(searchParams, page - 1)} label="<- Previous" />
              )}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Show pages around current
                const start = Math.max(1, Math.min(page - 2, totalPages - 4))
                const p = start + i
                if (p > totalPages) return null
                return (
                  <PaginationLink
                    key={p}
                    href={buildPageUrl(searchParams, p)}
                    label={String(p)}
                    active={p === page}
                    primaryColor={theme.primary}
                  />
                )
              })}
              {page < totalPages && (
                <PaginationLink href={buildPageUrl(searchParams, page + 1)} label="Next ->" />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── HELPER COMPONENTS ─────────────────────────────────────

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-5">
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-xs font-medium text-gray-500">{label}</div>
      <div className="mt-3 h-1 rounded-full w-10" style={{ background: accent }} />
    </div>
  )
}

function ScorePill({ value }: { value: number }) {
  const { color, bg } = classifyGap(value)
  return (
    <span
      className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full tabular-nums"
      style={{ color, background: bg }}
    >
      {value}%
    </span>
  )
}

function PaginationLink({
  href, label, active = false, primaryColor,
}: {
  href: string; label: string; active?: boolean; primaryColor?: string
}) {
  return (
    <Link
      href={href}
      className="text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors"
      style={
        active
          ? { background: primaryColor || '#185FA5', color: '#fff', borderColor: 'transparent' }
          : { background: '#fff', color: '#374151', borderColor: '#E5E7EB' }
      }
    >
      {label}
    </Link>
  )
}

// ── URL HELPER ────────────────────────────────────────────
function buildPageUrl(
  params: { search?: string; classification?: string; sector?: string },
  newPage: number,
): string {
  const q = new URLSearchParams()
  q.set('page', String(newPage))
  if (params.search)         q.set('search', params.search)
  if (params.classification) q.set('classification', params.classification)
  if (params.sector)         q.set('sector', params.sector)
  return `/bank/submissions?${q.toString()}`
}
