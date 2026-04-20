import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db'
import { Business, Diagnostic, TAProgramme, Tenant, User } from '@/models'
import { classifyGap, gapBg, gapColor, gapLabel } from '@/types'

const CLASS_BADGES: Record<string, { label: string; bg: string; text: string }> = {
  investment_ready:       { label: 'Investment Ready', bg: '#E1F5EE', text: '#0F6E56' },
  conditionally_lendable: { label: 'Conditionally Lendable', bg: '#FAEEDA', text: '#BA7517' },
  high_risk:              { label: 'High Risk', bg: '#FCEBEB', text: '#A32D2D' },
}

const LEVEL_COLORS: Record<string, string> = {
  strategic: '#185FA5',
  process: '#0F6E56',
  support: '#BA7517',
}

function startOfMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
}

function addMonths(date: Date, amount: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, 1))
}

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat('en', { month: 'short' }).format(date)
}

function percent(part: number, total: number) {
  if (!total) return 0
  return Math.round((part / total) * 100)
}

export default async function AdminDashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  await connectDB()

  const user = await User.findOne({ clerkId: userId }).lean() as any
  if (!user || user.role !== 'platform_admin') redirect('/dashboard')

  const now = new Date()
  const thisMonthStart = startOfMonth(now)
  const sixMonthsStart = addMonths(thisMonthStart, -5)

  const [
    tenants,
    totalBusinesses,
    totalDiagnostics,
    diagnosticsThisMonth,
    totalTAProgrammes,
    activeTAProgrammes,
    completedTAProgrammes,
    classAgg,
    scoreAgg,
    monthlyDiagnosticsRaw,
    monthlyTenantsRaw,
    topTenantAgg,
    areaAgg,
    recentDiagnostics,
  ] = await Promise.all([
    Tenant.find({}).sort({ createdAt: -1 }).lean() as Promise<any[]>,
    Business.countDocuments({}),
    Diagnostic.countDocuments({}),
    Diagnostic.countDocuments({ createdAt: { $gte: thisMonthStart } }),
    TAProgramme.countDocuments({}),
    TAProgramme.countDocuments({ status: 'active' }),
    TAProgramme.countDocuments({ status: 'completed' }),
    Diagnostic.aggregate([
      { $match: { 'result.classification': { $exists: true } } },
      { $group: { _id: '$result.classification', count: { $sum: 1 } } },
    ]),
    Diagnostic.aggregate([
      { $match: { 'result.lendabilityIndex': { $exists: true } } },
      { $group: { _id: null, avgIndex: { $avg: '$result.lendabilityIndex' } } },
    ]),
    Diagnostic.aggregate([
      { $match: { createdAt: { $gte: sixMonthsStart } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    Tenant.aggregate([
      { $match: { createdAt: { $gte: sixMonthsStart } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    Diagnostic.aggregate([
      {
        $group: {
          _id: '$tenantId',
          diagnostics: { $sum: 1 },
          avgIndex: { $avg: '$result.lendabilityIndex' },
          investmentReady: {
            $sum: {
              $cond: [{ $eq: ['$result.classification', 'investment_ready'] }, 1, 0],
            },
          },
          thisMonth: {
            $sum: {
              $cond: [{ $gte: ['$createdAt', thisMonthStart] }, 1, 0],
            },
          },
        },
      },
      { $sort: { diagnostics: -1 } },
      { $limit: 6 },
    ]),
    Diagnostic.aggregate([
      { $match: { 'result.areaScores.0': { $exists: true } } },
      { $unwind: '$result.areaScores' },
      {
        $group: {
          _id: '$result.areaScores.areaKey',
          areaName: { $first: '$result.areaScores.areaName' },
          level: { $first: '$result.areaScores.level' },
          avgPercentage: { $avg: '$result.areaScores.percentage' },
          observations: { $sum: 1 },
        },
      },
      { $sort: { avgPercentage: 1 } },
    ]),
    Diagnostic.find({ 'result.lendabilityIndex': { $exists: true } })
      .sort({ createdAt: -1 })
      .limit(8)
      .populate('tenantId', 'name slug')
      .populate('businessId', 'name sector')
      .lean() as Promise<any[]>,
  ])

  const tenantIds = topTenantAgg.map(item => item._id).filter(Boolean)
  const tenantDocs = tenantIds.length > 0
    ? await Tenant.find({ _id: { $in: tenantIds } }).select('name slug plan isActive').lean()
    : []
  const tenantMap = new Map(tenantDocs.map(tenant => [String(tenant._id), tenant]))

  const activeTenants = tenants.filter(tenant => tenant.isActive)
  // Revenue shown only when tenants pay via Monime — $0 until payment integration is live
  const platformMRR = 0

  const avgPlatformIndex = Math.round(scoreAgg[0]?.avgIndex ?? 0)
  const classCounts = classAgg.reduce((acc, item) => {
    acc[item._id] = item.count
    return acc
  }, {} as Record<string, number>)

  const monthlyDiagnosticsMap = new Map(
    monthlyDiagnosticsRaw.map(item => [
      `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
      item.count,
    ]),
  )
  const monthlyTenantsMap = new Map(
    monthlyTenantsRaw.map(item => [
      `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
      item.count,
    ]),
  )

  const monthSeries = Array.from({ length: 6 }, (_, index) => {
    const date = addMonths(sixMonthsStart, index)
    const key = monthKey(date)
    return {
      key,
      label: monthLabel(date),
      diagnostics: monthlyDiagnosticsMap.get(key) ?? 0,
      tenants: monthlyTenantsMap.get(key) ?? 0,
    }
  })

  const maxDiagnosticsMonth = Math.max(...monthSeries.map(item => item.diagnostics), 1)
  const maxTenantMonth = Math.max(...monthSeries.map(item => item.tenants), 1)

  const topTenants = topTenantAgg.map(item => {
    const tenant = tenantMap.get(String(item._id))
    return {
      id: String(item._id),
      name: tenant?.name ?? 'Unknown tenant',
      slug: tenant?.slug ?? 'unknown',
      plan: tenant?.plan ?? 'starter',
      isActive: tenant?.isActive ?? false,
      diagnostics: item.diagnostics ?? 0,
      thisMonth: item.thisMonth ?? 0,
      avgIndex: Math.round(item.avgIndex ?? 0),
      investmentReady: item.investmentReady ?? 0,
    }
  })

  const areaRows = areaAgg.map(item => {
    const avgPercentage = Math.round(item.avgPercentage ?? 0)
    return {
      key: item._id,
      areaName: item.areaName ?? item._id,
      level: item.level ?? 'support',
      avgPercentage,
      observations: item.observations ?? 0,
      gap: classifyGap(avgPercentage),
    }
  })

  const funnelStages = [
    { label: 'SME Profiles', value: totalBusinesses, color: '#185FA5' },
    { label: 'Diagnostics Scored', value: totalDiagnostics, color: '#0F6E56' },
    { label: '60+ Index', value: (classCounts.investment_ready ?? 0) + (classCounts.conditionally_lendable ?? 0), color: '#1D9E75' },
    { label: 'TA Started', value: totalTAProgrammes, color: '#BA7517' },
    { label: 'Investment Ready', value: classCounts.investment_ready ?? 0, color: '#5B1FA8' },
  ]
  const funnelBase = Math.max(funnelStages[0]?.value ?? 0, 1)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Platform Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Live tenant, diagnostic, and TA activity across the BizReady platform.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/tenants"
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Manage tenants
          </Link>
          <Link
            href="/onboarding"
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-violet-700 hover:bg-violet-800 transition-colors"
          >
            Add tenant
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        {[
          { label: 'Active tenants', value: activeTenants.length.toLocaleString(), sub: `${tenants.length} total tenants` },
          { label: 'Revenue Collected', value: `$${platformMRR.toLocaleString()}`, sub: 'Live when Monime billing is active' },
          { label: 'SME businesses', value: totalBusinesses.toLocaleString(), sub: `${diagnosticsThisMonth.toLocaleString()} diagnostics this month` },
          { label: 'Diagnostics scored', value: totalDiagnostics.toLocaleString(), sub: `${avgPlatformIndex}% average platform index` },
          { label: 'TA programmes', value: totalTAProgrammes.toLocaleString(), sub: `${activeTAProgrammes} active / ${completedTAProgrammes} completed` },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{card.label}</p>
            <p className="text-2xl font-semibold text-gray-900 mt-2">{card.value}</p>
            <p className="text-xs text-gray-500 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Platform growth trend</h2>
              <p className="text-xs text-gray-400 mt-1">Last 6 months of diagnostics and new tenants</p>
            </div>
            <Link href="/admin/diagnostics" className="text-xs font-semibold text-violet-700 hover:text-violet-800">
              View diagnostics
            </Link>
          </div>
          <div className="space-y-4">
            {monthSeries.map(month => (
              <div key={month.key} className="grid grid-cols-[52px_1fr] gap-3 items-center">
                <span className="text-xs font-medium text-gray-500">{month.label}</span>
                <div className="space-y-2">
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-gray-500">Diagnostics</span>
                      <span className="font-medium text-gray-900">{month.diagnostics}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-2 rounded-full bg-violet-600"
                        style={{ width: `${Math.max((month.diagnostics / maxDiagnosticsMonth) * 100, month.diagnostics ? 10 : 0)}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-gray-500">New tenants</span>
                      <span className="font-medium text-gray-900">{month.tenants}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-2 rounded-full bg-sky-500"
                        style={{ width: `${Math.max((month.tenants / maxTenantMonth) * 100, month.tenants ? 10 : 0)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-900">Readiness mix</h2>
          <p className="text-xs text-gray-400 mt-1 mb-4">Classification of scored diagnostics</p>
          <div className="space-y-3">
            {Object.entries(CLASS_BADGES).map(([key, badge]) => {
              const count = classCounts[key] ?? 0
              const pct = percent(count, totalDiagnostics)
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-gray-600">{badge.label}</span>
                    <span className="text-xs font-semibold" style={{ color: badge.text }}>
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: badge.text }} />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-6 pt-5 border-t border-gray-100">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Live funnel</h3>
            <div className="space-y-3">
              {funnelStages.map(stage => (
                <div key={stage.label}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-600">{stage.label}</span>
                    <span className="font-semibold text-gray-900">
                      {stage.value.toLocaleString()}
                      <span className="text-gray-400 font-normal ml-1">
                        {percent(stage.value, funnelBase)}%
                      </span>
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-2.5 rounded-full"
                      style={{
                        width: `${Math.max((stage.value / funnelBase) * 100, stage.value ? 8 : 0)}%`,
                        background: stage.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Top tenants</h2>
              <p className="text-xs text-gray-400 mt-1">Sorted by diagnostic volume</p>
            </div>
            <Link href="/admin/tenants" className="text-xs font-semibold text-violet-700 hover:text-violet-800">
              All tenants
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Tenant', 'Plan', 'Diagnostics', 'This Month', 'Avg Index', 'Ready'].map(header => (
                    <th
                      key={header}
                      className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wide text-gray-400 whitespace-nowrap"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topTenants.map(tenant => (
                  <tr key={tenant.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{tenant.name}</p>
                      <p className="text-[10px] text-gray-400">{tenant.slug}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize bg-gray-100 text-gray-700">
                        {tenant.plan}
                      </span>
                      <p className={`text-[10px] mt-1 ${tenant.isActive ? 'text-emerald-700' : 'text-red-600'}`}>
                        {tenant.isActive ? 'Active' : 'Inactive'}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{tenant.diagnostics.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-700">{tenant.thisMonth.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-1.5 rounded-full"
                            style={{
                              width: `${tenant.avgIndex}%`,
                              background: tenant.avgIndex >= 80 ? '#0F6E56' : tenant.avgIndex >= 60 ? '#BA7517' : '#A32D2D',
                            }}
                          />
                        </div>
                        <span className="font-semibold text-gray-900">{tenant.avgIndex}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{tenant.investmentReady.toLocaleString()}</td>
                  </tr>
                ))}
                {topTenants.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">
                      No tenant activity yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Capacity heatmap</h2>
              <p className="text-xs text-gray-400 mt-1">Average score by area across scored diagnostics</p>
            </div>
            <Link href="/admin/diagnostics" className="text-xs font-semibold text-violet-700 hover:text-violet-800">
              Review diagnostics
            </Link>
          </div>
          <div className="space-y-2.5">
            {areaRows.map(row => (
              <div key={row.key} className="flex items-center gap-3">
                <span
                  className="w-1.5 h-6 rounded-full flex-shrink-0"
                  style={{ background: LEVEL_COLORS[row.level] ?? LEVEL_COLORS.support }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <span className="text-xs font-medium text-gray-700 truncate">{row.areaName}</span>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap">{row.observations} submissions</span>
                  </div>
                  <div className="h-4 rounded-full bg-gray-100 overflow-hidden relative">
                    <div
                      className="h-4 rounded-full"
                      style={{
                        width: `${Math.max(row.avgPercentage, row.avgPercentage ? 10 : 0)}%`,
                        background: gapColor(row.gap),
                      }}
                    />
                    <span className="absolute inset-y-0 right-2 flex items-center text-[10px] font-semibold text-gray-700">
                      {row.avgPercentage}%
                    </span>
                  </div>
                </div>
                <span
                  className="text-[10px] font-medium px-2 py-1 rounded-full whitespace-nowrap"
                  style={{ background: gapBg(row.gap), color: gapColor(row.gap) }}
                >
                  {gapLabel(row.gap)}
                </span>
              </div>
            ))}
            {areaRows.length === 0 && (
              <p className="text-sm text-gray-400 py-8 text-center">No area score data yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Recent scored diagnostics</h2>
            <p className="text-xs text-gray-400 mt-1">Latest platform-wide submissions</p>
          </div>
          <Link href="/admin/diagnostics" className="text-xs font-semibold text-violet-700 hover:text-violet-800">
            Open diagnostics
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Business', 'Tenant', 'Period', 'Score', 'Classification', 'Date'].map(header => (
                  <th
                    key={header}
                    className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wide text-gray-400 whitespace-nowrap"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentDiagnostics.map(diagnostic => {
                const classification = diagnostic.result?.classification ?? 'high_risk'
                const badge = CLASS_BADGES[classification] ?? CLASS_BADGES.high_risk
                const score = Math.round(diagnostic.result?.lendabilityIndex ?? 0)
                const createdAt = diagnostic.createdAt ? new Date(diagnostic.createdAt) : null

                return (
                  <tr key={String(diagnostic._id)} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{diagnostic.businessId?.name ?? 'Unknown business'}</p>
                      <p className="text-[10px] text-gray-400">{diagnostic.businessId?.sector ?? 'Unknown sector'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-900">{diagnostic.tenantId?.name ?? 'Unknown tenant'}</p>
                      <p className="text-[10px] text-gray-400">{diagnostic.tenantId?.slug ?? '-'}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{diagnostic.period ?? '-'}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold" style={{ color: gapColor(classifyGap(score)) }}>
                        {score}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{ background: badge.bg, color: badge.text }}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {createdAt ? createdAt.toLocaleDateString() : '-'}
                    </td>
                  </tr>
                )
              })}
              {recentDiagnostics.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">
                    No scored diagnostics available yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
