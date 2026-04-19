import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { connectDB } from '@/lib/db'
import { User, Tenant, Business, Diagnostic, TAProgramme } from '@/models'
import { classifyGap, gapColor, gapLabel } from '@/types'
import { BankFunnel } from '@/components/funnel/InvestmentFunnel'

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

function indexBadgeBg(idx: number) {
  if (idx >= 80) return '#E1F5EE'
  if (idx >= 60) return '#FAEEDA'
  return '#FCEBEB'
}

function classLabel(c: string) {
  if (c === 'investment_ready')       return 'Investment Ready'
  if (c === 'conditionally_lendable') return 'Conditionally Lendable'
  return 'High Risk'
}

function formatDate(d: any) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default async function BankDashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  await connectDB()

  const user   = await User.findOne({ clerkId: userId }).lean() as any
  const tenant = await Tenant.findById(user?.tenantId).lean() as any
  if (!user || !tenant) redirect('/onboarding')

  const tenantId = tenant._id

  const [totalDiagnostics, totalBusinesses, activeTA, recentDiags, scored60Plus, taStarted, investmentReady] = await Promise.all([
    Diagnostic.countDocuments({ tenantId }),
    Business.countDocuments({ tenantId }),
    TAProgramme.countDocuments({ tenantId, status: 'active' }),
    Diagnostic.find({ tenantId })
      .sort({ createdAt: -1 })
      .limit(8)
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
  const firstName = user.name?.split(' ')[0] ?? 'there'

  const stats = [
    { label: 'Total diagnostics', value: totalDiagnostics, sub: 'submitted',        color: theme.primary },
    { label: 'Average index',     value: avgIndex,          sub: avgIndex >= 60 ? 'Conditionally Lendable+' : 'Below threshold', color: indexColor(avgIndex) },
    { label: 'Investment ready',  value: investmentReady,   sub: `of ${totalDiagnostics} total`, color: '#0F6E56' },
    { label: 'Active programmes', value: activeTA,           sub: 'TA programmes',   color: '#185FA5' },
  ]

  const tiers = [
    { label: 'Investment Ready',       min: 80,  max: 101, color: '#0F6E56', bg: '#E1F5EE' },
    { label: 'Conditionally Lendable', min: 60,  max: 80,  color: '#BA7517', bg: '#FAEEDA' },
    { label: 'High Risk',              min: 0,   max: 60,  color: '#A32D2D', bg: '#FCEBEB' },
  ]

  return (
    <div className="space-y-6 max-w-full">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {firstName}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{theme.bankName} · SME Investment Readiness</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href="/bank/submissions"
            className="px-4 py-2 rounded-full text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors">
            View submissions
          </Link>
          <Link href={`/diagnostic/${tenant.slug}`} target="_blank"
            className="px-4 py-2 rounded-full text-xs font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ background: theme.primary }}>
            Share link →
          </Link>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-5">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">{s.label}</p>
            <p className="text-4xl font-thin leading-none mb-1" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-gray-400">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Hero gradient — only when data exists */}
      {avgIndex > 0 && (
        <div className="rounded-3xl shadow-xl p-7 text-white relative overflow-hidden"
          style={{ background: indexBg(avgIndex) }}>
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 85% 50%, white 0%, transparent 55%)' }} />
          <div className="relative flex items-center gap-8">
            <div className="flex-1">
              <p className="text-xs font-medium opacity-60 uppercase tracking-widest mb-2">Portfolio average</p>
              <p className="text-5xl font-thin mb-1">{avgIndex}</p>
              <p className="text-base font-medium opacity-80">
                {avgIndex >= 80 ? 'Investment Ready' : avgIndex >= 60 ? 'Conditionally Lendable' : 'High Risk'}
              </p>
            </div>
            <div className="hidden sm:grid grid-cols-3 gap-6 text-center">
              {tiers.map(tier => {
                const count = scoredDiags.filter((d: any) =>
                  d.result.lendabilityIndex >= tier.min && d.result.lendabilityIndex < tier.max
                ).length
                const pct = scoredDiags.length > 0 ? Math.round((count / scoredDiags.length) * 100) : 0
                return (
                  <div key={tier.label}>
                    <p className="text-2xl font-thin">{count}</p>
                    <p className="text-[10px] opacity-70 leading-tight mt-0.5">{tier.label}</p>
                    <p className="text-[10px] opacity-50">{pct}%</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main two-column grid */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* Recent submissions */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-200/60 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Recent submissions</h2>
            <Link href="/bank/submissions" className="text-xs font-semibold hover:opacity-70 transition-opacity"
              style={{ color: theme.primary }}>
              View all →
            </Link>
          </div>

          {recentDiags.length === 0 ? (
            <div className="p-14 text-center">
              <p className="text-sm text-gray-400 mb-2">No submissions yet.</p>
              <p className="text-xs text-gray-400 mb-4">Share your diagnostic link to get started.</p>
              <code className="inline-block px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-500">
                /diagnostic/{tenant.slug}
              </code>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentDiags.map((d: any) => {
                const biz = d.businessId as any
                const idx = d.result?.lendabilityIndex ?? null
                return (
                  <Link key={d._id} href={`/bank/sme/${biz?._id}`}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/70 transition-colors group">

                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white flex-shrink-0"
                      style={{ background: idx !== null ? indexBg(idx) : theme.primary }}>
                      {(biz?.name || '?')[0].toUpperCase()}
                    </div>

                    {/* Name + sector */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{biz?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-400">{biz?.sector} · {d.period}</p>
                    </div>

                    {/* Date */}
                    <p className="text-xs text-gray-400 flex-shrink-0 hidden sm:block">{formatDate(d.createdAt)}</p>

                    {/* Score */}
                    {idx !== null ? (
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-thin leading-none" style={{ color: indexColor(idx) }}>{idx}</p>
                        <p className="text-[10px] mt-0.5 px-2 py-0.5 rounded-full inline-block"
                          style={{ background: indexBadgeBg(idx), color: indexColor(idx) }}>
                          {classLabel(d.result?.classification ?? '')}
                        </p>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300 flex-shrink-0">Not scored</span>
                    )}

                    <span className="text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0">→</span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">

          {/* Readiness distribution */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200/60 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Readiness distribution</h2>
            {scoredDiags.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No scored diagnostics yet</p>
            ) : (
              <div className="space-y-4">
                {tiers.map(tier => {
                  const count = scoredDiags.filter((d: any) =>
                    d.result.lendabilityIndex >= tier.min && d.result.lendabilityIndex < tier.max
                  ).length
                  const pct = scoredDiags.length > 0 ? Math.round((count / scoredDiags.length) * 100) : 0
                  return (
                    <div key={tier.label}>
                      <div className="flex justify-between items-center mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: tier.color }} />
                          <span className="text-xs text-gray-600">{tier.label}</span>
                        </div>
                        <span className="text-xs font-semibold" style={{ color: tier.color }}>{count}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, background: tier.color }} />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">{pct}% of scored</p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200/60 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Quick links</h2>
            <div className="space-y-0.5">
              {[
                { href: '/bank/submissions', label: 'All submissions',   icon: '≡' },
                { href: '/bank/sme',         label: 'SME profiles',      icon: '○' },
                { href: '/bank/analytics',   label: 'Analytics',         icon: '▣' },
                { href: '/bank/ta',          label: 'TA programmes',     icon: '●' },
                { href: '/bank/questions',   label: 'Question bank',     icon: '?' },
                { href: '/bank/reports',     label: 'Download reports',  icon: '↓' },
                { href: '/bank/settings',    label: 'Bank settings',     icon: '⚙' },
              ].map(link => (
                <Link key={link.href} href={link.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-xs text-gray-600 group transition-colors">
                  <span className="text-gray-400 group-hover:text-gray-600 w-4 transition-colors">{link.icon}</span>
                  {link.label}
                  <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-gray-400">→</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Investment Funnel */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200/60 p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Investment Readiness Funnel</h2>
            <p className="text-xs text-gray-400 mt-0.5">Conversion from submission to loan approval</p>
          </div>
          <Link href="/bank/analytics" className="text-xs font-semibold hover:opacity-70 transition-opacity"
            style={{ color: theme.primary }}>
            Full analytics →
          </Link>
        </div>
        <div className="max-w-sm mx-auto">
          <BankFunnel stats={funnelStats} height={260} showConversion />
        </div>
      </div>

    </div>
  )
}
