import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { connectDB } from '@/lib/db'
import { User, Tenant, Business, Diagnostic, TAProgramme } from '@/models'
import { classifyGap, gapColor, gapLabel } from '@/types'
import { BankFunnel } from '@/components/funnel/InvestmentFunnel'

export default async function BankDashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  await connectDB()

  const user = await User.findOne({ clerkId: userId }).lean() as any
  const tenant = await Tenant.findById(user?.tenantId).lean() as any
  if (!user || !tenant) redirect('/onboarding')

  const tenantId = tenant._id

  const [totalDiagnostics, totalBusinesses, activeTA, recentDiags, scored60Plus, taStarted, investmentReady] = await Promise.all([
    Diagnostic.countDocuments({ tenantId }),
    Business.countDocuments({ tenantId }),
    TAProgramme.countDocuments({ tenantId, status: 'active' }),
    Diagnostic.find({ tenantId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('businessId')
      .lean() as any,
    Diagnostic.countDocuments({ tenantId, 'result.lendabilityIndex': { $gte: 60 } }),
    TAProgramme.countDocuments({ tenantId }),
    Diagnostic.countDocuments({ tenantId, 'result.classification': 'investment_ready' }),
  ])

  const scoredDiags = recentDiags.filter((d: any) => d.result?.lendabilityIndex != null)
  const avgIndex = scoredDiags.length > 0
    ? Math.round(scoredDiags.reduce((s: number, d: any) => s + d.result.lendabilityIndex, 0) / scoredDiags.length)
    : 0

  const funnelStats = {
    formsSent: totalDiagnostics,
    diagnosticsComplete: totalDiagnostics,
    scored60Plus,
    taStarted,
    loanApproved: investmentReady,
  }

  const theme = tenant.theme

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Welcome back, {user.name.split(' ')[0]}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{theme.bankName} - SME Investment Readiness Dashboard</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/bank/submissions"
            className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            View submissions
          </Link>
          <Link
            href={`/diagnostic/${tenant.slug}`}
            target="_blank"
            className="px-3 py-1.5 text-white rounded-lg text-xs font-medium hover:opacity-90"
            style={{ background: theme.primary }}
          >
            Share diagnostic link -&gt;
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total diagnostics', value: totalDiagnostics, icon: 'DB', color: theme.primary },
          { label: 'Average index', value: `${avgIndex}%`, icon: 'UP', color: avgIndex >= 80 ? '#0F6E56' : avgIndex >= 60 ? '#BA7517' : '#A32D2D' },
          { label: 'Investment ready', value: investmentReady, icon: 'IR', color: '#0F6E56' },
          { label: 'Active TA progs.', value: activeTA, icon: 'TA', color: '#185FA5' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold"
                style={{ background: `${s.color}18`, color: s.color }}
              >
                {s.icon}
              </div>
              <span className="text-xs text-gray-500">{s.label}</span>
            </div>
            <p className="text-2xl font-semibold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-900">Recent submissions</h2>
            <Link href="/bank/submissions" className="text-xs font-medium" style={{ color: theme.primary }}>
              View all -&gt;
            </Link>
          </div>

          {recentDiags.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm text-gray-400 mb-3">No submissions yet.</p>
              <p className="text-xs text-gray-400">Share your diagnostic link to get started:</p>
              <code className="mt-2 inline-block px-3 py-1.5 bg-gray-50 rounded border border-gray-100 text-xs text-gray-500">
                /diagnostic/{tenant.slug}
              </code>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentDiags.map((d: any) => {
                const biz = d.businessId as any
                const idx = d.result?.lendabilityIndex ?? 0
                const gap = classifyGap(idx)
                return (
                  <Link
                    key={d._id}
                    href={`/bank/sme/${biz?._id}`}
                    className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0 text-white"
                      style={{ background: theme.primary }}
                    >
                      {(biz?.name || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{biz?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-400">{biz?.sector} - {d.period}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold" style={{ color: gapColor(gap) }}>{idx}%</p>
                      <p
                        className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{
                          background: gap === 'high_priority_gap' ? '#FCEBEB' : gap === 'low_priority_gap' ? '#FAEEDA' : '#E1F5EE',
                          color: gapColor(gap),
                        }}
                      >
                        {gapLabel(gap)}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Readiness distribution</h2>
            {scoredDiags.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No scored diagnostics yet</p>
            ) : (
              <div className="space-y-3">
                {[
                  { label: 'Investment Ready', color: '#0F6E56' },
                  { label: 'Conditionally Lendable', color: '#BA7517' },
                  { label: 'High Risk', color: '#A32D2D' },
                ].map(tier => {
                  const count = scoredDiags.filter((d: any) =>
                    tier.label === 'Investment Ready'
                      ? d.result.lendabilityIndex >= 80
                      : tier.label === 'Conditionally Lendable'
                        ? d.result.lendabilityIndex >= 60 && d.result.lendabilityIndex < 80
                        : d.result.lendabilityIndex < 60,
                  ).length
                  const pct = scoredDiags.length > 0 ? Math.round((count / scoredDiags.length) * 100) : 0
                  return (
                    <div key={tier.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600">{tier.label}</span>
                        <span className="font-medium" style={{ color: tier.color }}>{count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full">
                        <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: tier.color }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Quick links</h2>
            <div className="space-y-1">
              {[
                { href: '/bank/submissions', label: 'All submissions' },
                { href: '/bank/sme', label: 'SME profiles' },
                { href: '/bank/analytics', label: 'Analytics & charts' },
                { href: '/bank/ta', label: 'TA programmes' },
                { href: '/bank/questions', label: 'Question bank' },
                { href: '/bank/reports', label: 'Download reports' },
                { href: '/bank/settings', label: 'Bank settings' },
              ].map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 text-xs text-gray-600 group"
                >
                  {link.label}
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: theme.primary }}>
                    -&gt;
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Investment Readiness Funnel</h2>
            <p className="text-xs text-gray-400 mt-0.5">Conversion from submission to loan approval</p>
          </div>
          <Link href="/bank/analytics" className="text-xs font-medium" style={{ color: theme.primary }}>
            Full analytics -&gt;
          </Link>
        </div>
        <div className="max-w-sm mx-auto">
          <BankFunnel stats={funnelStats} height={260} showConversion />
        </div>
      </div>
    </div>
  )
}
