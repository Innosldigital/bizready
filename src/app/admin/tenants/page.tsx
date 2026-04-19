// src/app/admin/tenants/page.tsx
// Tenant management page - server component (admin only)

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { connectDB } from '@/lib/db'
import { User, Tenant, Diagnostic } from '@/models'
import ManagerAssign from './ManagerAssign'

// ── CONFIG ────────────────────────────────────────────────

const PLAN_PRICES: Record<string, number> = {
  starter:    299,
  growth:     899,
  enterprise: 2500,
  owner:      0,
}

const PLAN_BADGE: Record<string, { bg: string; color: string }> = {
  starter:    { bg: '#F3F4F6', color: '#6B7280' },
  growth:     { bg: '#EFF6FF', color: '#185FA5' },
  enterprise: { bg: '#EDE9FE', color: '#5B1FA8' },
  owner:      { bg: '#FFF7ED', color: '#C2410C' },
}

const STATUS_BADGE: Record<string, { bg: string; color: string; dot: string }> = {
  active:   { bg: '#E1F5EE', color: '#0F6E56', dot: '#0F6E56' },
  inactive: { bg: '#FCEBEB', color: '#A32D2D', dot: '#A32D2D' },
}

// ── PAGE ──────────────────────────────────────────────────

export default async function TenantsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  await connectDB()

  const user = await User.findOne({ clerkId: userId }).lean() as any
  if (!user || user.role !== 'platform_admin') redirect('/dashboard')

  const tenants = await Tenant.find({}).sort({ createdAt: -1 }).lean() as any[]

  // All platform admins available to assign as success managers
  const platformAdmins = await User.find({ role: 'platform_admin' })
    .select('clerkId name email')
    .lean() as any[]

  // Aggregate diagnostic counts per tenant in one query
  const diagnosticAggs = await Diagnostic.aggregate([
    {
      $group: {
        _id:          '$tenantId',
        total:        { $sum: 1 },
        avgIndex:     { $avg: '$result.lendabilityIndex' },
      },
    },
  ])

  // This month's diagnostics
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const thisMonthAggs = await Diagnostic.aggregate([
    { $match: { createdAt: { $gte: startOfMonth } } },
    { $group: { _id: '$tenantId', count: { $sum: 1 } } },
  ])

  const diagMap: Record<string, { total: number; avgIndex: number }> = {}
  for (const a of diagnosticAggs) {
    diagMap[String(a._id)] = {
      total:    a.total,
      avgIndex: a.avgIndex ? Math.round(a.avgIndex) : 0,
    }
  }

  const monthMap: Record<string, number> = {}
  for (const a of thisMonthAggs) {
    monthMap[String(a._id)] = a.count
  }

  // Summary stats
  const activeTenants   = tenants.filter(t => t.isActive)
  const totalMRR        = activeTenants.reduce((s, t) => s + (PLAN_PRICES[t.plan] ?? 0), 0)
  const totalDiagnostics = Object.values(diagMap).reduce((s, v) => s + v.total, 0)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tenants</h1>
          <p className="text-sm text-gray-500 mt-1">All banks and institutions on the platform</p>
        </div>
        <Link
          href="/onboarding"
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-violet-700 hover:bg-violet-800 transition-colors"
        >
          + Add Tenant
        </Link>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1">Total Tenants</p>
          <p className="text-2xl font-bold text-gray-900">{tenants.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">{activeTenants.length} active</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1">Active Tenants</p>
          <p className="text-2xl font-bold text-emerald-700">{activeTenants.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">{tenants.length - activeTenants.length} inactive</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1">Platform MRR</p>
          <p className="text-2xl font-bold text-gray-900">${totalMRR.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-0.5">ARR: ${(totalMRR * 12).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1">Total Diagnostics</p>
          <p className="text-2xl font-bold text-gray-900">{totalDiagnostics.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-0.5">All time across tenants</p>
        </div>
      </div>

      {/* Tenants table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">All Tenants</h2>
          <span className="text-xs text-gray-400">{tenants.length} total</span>
        </div>

        {tenants.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-gray-500 mb-4">No tenants found.</p>
            <Link href="/onboarding"
              className="inline-block px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-violet-700 hover:bg-violet-800 transition-colors">
              Onboard First Tenant
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Name', 'Plan', 'Total Diagnostics', 'This Month', 'Avg Index', 'Success Manager', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant: any) => {
                  const tid        = String(tenant._id)
                  const diagStats  = diagMap[tid]  ?? { total: 0, avgIndex: 0 }
                  const thisMonth  = monthMap[tid]  ?? 0
                  const isActive   = tenant.isActive
                  const statusKey  = isActive ? 'active' : 'inactive'
                  const statusStyle = STATUS_BADGE[statusKey]
                  const planStyle  = PLAN_BADGE[tenant.plan] ?? PLAN_BADGE.starter
                  const mrr        = isActive ? (PLAN_PRICES[tenant.plan] ?? 0) : 0
                  const avgIdx     = diagStats.avgIndex

                  return (
                    <tr key={tid} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-gray-900">{tenant.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">{tenant.slug}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{tenant.contactEmail}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize"
                            style={{ background: planStyle.bg, color: planStyle.color }}>
                            {tenant.plan}
                          </span>
                          {mrr > 0 && (
                            <p className="text-[10px] text-gray-400 mt-1">${mrr}/mo</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-gray-700 font-medium">
                        {diagStats.total.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 text-gray-700">
                        {thisMonth > 0 ? (
                          <span className="font-medium text-emerald-700">+{thisMonth}</span>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {diagStats.total > 0 ? (
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
                              <div className="h-1.5 rounded-full transition-all"
                                style={{
                                  width:      `${avgIdx}%`,
                                  background: avgIdx >= 80 ? '#0F6E56' : avgIdx >= 60 ? '#BA7517' : '#A32D2D',
                                }} />
                            </div>
                            <span className="font-semibold text-gray-900">{avgIdx}%</span>
                          </div>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <ManagerAssign
                          tenantId={tid}
                          admins={platformAdmins.map((a: any) => ({ clerkId: a.clerkId, name: a.name, email: a.email }))}
                          currentManager={tenant.successManagerName ? { name: tenant.successManagerName, email: tenant.successManagerEmail } : null}
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="flex items-center gap-1.5 font-medium"
                          style={{ color: statusStyle.color }}>
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ background: statusStyle.dot }} />
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/admin/diagnostics?tenantId=${tid}`}
                          className="text-xs font-semibold text-violet-600 hover:text-violet-800 hover:underline whitespace-nowrap"
                        >
                          View Diagnostics
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

    </div>
  )
}
