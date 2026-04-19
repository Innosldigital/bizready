// src/app/bank/reports/page.tsx
// Reports generation page - server component

import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db'
import { User, Tenant, Diagnostic } from '@/models'

// ── HELPERS ───────────────────────────────────────────────

function classificationBadge(classification: string) {
  const map: Record<string, { label: string; bg: string; text: string }> = {
    investment_ready:       { label: 'Investment Ready',       bg: '#E1F5EE', text: '#0F6E56' },
    conditionally_lendable: { label: 'Conditionally Lendable', bg: '#FAEEDA', text: '#BA7517' },
    high_risk:              { label: 'High Risk',              bg: '#FCEBEB', text: '#A32D2D' },
  }
  const c = map[classification] ?? { label: classification, bg: '#F3F4F6', text: '#374151' }
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{ background: c.bg, color: c.text }}
    >
      {c.label}
    </span>
  )
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function isThisMonth(date: Date | string | null | undefined): boolean {
  if (!date) return false
  const d = new Date(date)
  const now = new Date()
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

// ── PAGE ──────────────────────────────────────────────────

export default async function ReportsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  await connectDB()
  const user   = await User.findOne({ clerkId: userId }).lean() as any
  if (!user) redirect('/onboarding')
  const tenant = await Tenant.findById(user.tenantId).lean() as any
  if (!tenant) redirect('/onboarding')

  const tenantId = user.tenantId

  // Fetch last 20 scored diagnostics for this tenant, populate business name
  const diagnostics = await Diagnostic.find({ tenantId, status: { $in: ['scored', 'reported'] } })
    .populate('businessId', 'name _id')
    .sort({ createdAt: -1 })
    .limit(20)
    .lean() as any[]

  const reportsThisMonth = diagnostics.filter((d: any) => isThisMonth(d.createdAt)).length

  const theme = tenant.theme

  return (
    <div className="p-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Reports</h1>
          <p className="text-sm text-gray-500">
            Generate and export diagnostic reports for your SME portfolio
          </p>
        </div>

        <Link
          href="/bank/submissions"
          className="px-4 py-2 text-white rounded-lg text-sm font-medium shadow-sm hover:opacity-90 transition-opacity"
          style={{ background: theme.primary }}
        >
          Review submissions
        </Link>
      </div>

      {/* Summary banner */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Total Reports Available</p>
          <p className="text-2xl font-bold text-gray-900">{diagnostics.length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Generated This Month</p>
          <p className="text-2xl font-bold text-gray-900">{reportsThisMonth}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">PDF Export</p>
          <p className="text-sm font-medium text-gray-700 mt-1">Available</p>
        </div>
      </div>

      {/* Reports list */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 text-sm">
            Diagnostic Reports ({diagnostics.length})
          </h2>
          <p className="text-xs text-gray-400">Each scored diagnostic is available as a report</p>
        </div>

        {diagnostics.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl text-gray-300">\u25A4</div>
            <p className="text-sm text-gray-500 mb-1">No reports yet</p>
            <p className="text-xs text-gray-400">
              Reports are generated once a diagnostic has been scored. Share your diagnostic link to collect submissions.
            </p>
            <div className="mt-6 inline-block px-4 py-2 bg-gray-50 rounded-lg border border-gray-100 text-xs font-mono text-gray-400">
              bizready.io/diagnostic/{tenant.slug}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {diagnostics.map((diag: any) => {
              const business       = diag.businessId
              const bizName        = typeof business === 'object' ? business?.name : 'Unknown Business'
              const score          = diag.result?.lendabilityIndex ?? null
              const classification = diag.result?.classification ?? null
              const reportDate     = diag.scoredAt ?? diag.createdAt

              return (
                <div
                  key={diag._id?.toString()}
                  className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors"
                >
                  {/* Report icon */}
                  <div
                    className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center text-sm"
                    style={{ background: `${theme.primary}12`, color: theme.primary }}
                  >
                    \u25A4
                  </div>

                  {/* Business + date */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{bizName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(reportDate)}</p>
                  </div>

                  {/* Index score */}
                  {score !== null ? (
                    <div className="text-center min-w-[60px]">
                      <p className="text-lg font-bold text-gray-900">{score}</p>
                      <p className="text-[10px] text-gray-400">Index score</p>
                    </div>
                  ) : (
                    <div className="min-w-[60px]">
                      <p className="text-xs text-gray-300 text-center">No score</p>
                    </div>
                  )}

                  {/* Classification badge */}
                  <div className="min-w-[160px] flex justify-center">
                    {classification ? classificationBadge(classification) : (
                      <span className="text-xs text-gray-300">-</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {typeof business === 'object' && business?._id ? (
                      <>
                        <Link
                          href={`/bank/ta/diagnosis/${String(business._id)}`}
                          className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        >
                          View Report
                        </Link>
                        <Link
                          href={`/bank/sme/${String(business._id)}`}
                          className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        >
                          SME Profile
                        </Link>
                      </>
                    ) : null}

                    {/* Download PDF */}
                    {typeof business === 'object' && business?._id ? (
                      <a
                        href={`/api/bank/reports/pdf?businessId=${String(business._id)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-white shadow-sm hover:opacity-90 transition-opacity"
                        style={{ background: theme.primary }}
                      >
                        Download PDF
                      </a>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-gray-400 text-center">
        PDF reports include the full capacity breakdown and TA plan. Automated email delivery coming soon.
      </p>
    </div>
  )
}
