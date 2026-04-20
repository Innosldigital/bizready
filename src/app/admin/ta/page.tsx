// src/app/admin/ta/page.tsx
// TA Programmes — tenants who have selected Innovation SL as their TA provider

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { connectDB } from '@/lib/db'
import { User, Tenant, Business } from '@/models'

const PLAN_COLOR: Record<string, { bg: string; text: string }> = {
  starter:    { bg: '#F3F4F6', text: '#6B7280' },
  growth:     { bg: '#EFF6FF', text: '#185FA5' },
  enterprise: { bg: '#EDE9FE', text: '#5B1FA8' },
  owner:      { bg: '#FFF7ED', text: '#C2410C' },
}

export default async function TaProgrammesPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  await connectDB()

  const user = await User.findOne({ clerkId: userId }).lean() as any
  if (!user || !['platform_admin', 'innosl_admin', 'project_manager'].includes(user.role)) {
    redirect('/dashboard')
  }

  // Tenants that have opted in to Innovation SL TA
  const tenants = await Tenant.find({ taProvider: 'innovation_sl', isActive: true })
    .sort({ name: 1 })
    .lean() as any[]

  // All tenants count (for context)
  const allTenantsCount = await Tenant.countDocuments({ isActive: true, plan: { $ne: 'owner' } })

  // SME summaries per tenant
  const tenantIds = tenants.map(t => t._id)
  const smeSummary = await Business.aggregate([
    { $match: { tenantId: { $in: tenantIds } } },
    {
      $group: {
        _id:        '$tenantId',
        total:      { $sum: 1 },
        unassigned: { $sum: { $cond: [{ $ifNull: ['$focalPersonId', true] }, 1, 0] } },
        avgScore:   { $avg: { $ifNull: ['$latestScore', 0] } },
        ir:   { $sum: { $cond: [{ $eq: ['$latestClassification', 'investment_ready'] }, 1, 0] } },
        cl:   { $sum: { $cond: [{ $eq: ['$latestClassification', 'conditionally_lendable'] }, 1, 0] } },
        hr:   { $sum: { $cond: [{ $eq: ['$latestClassification', 'high_risk'] }, 1, 0] } },
      },
    },
  ])

  const smeMap: Record<string, any> = {}
  for (const s of smeSummary) smeMap[String(s._id)] = s

  const rows = tenants.map(t => ({
    ...t,
    s: smeMap[String(t._id)] ?? { total: 0, unassigned: 0, avgScore: 0, ir: 0, cl: 0, hr: 0 },
  }))

  const totalSMEs      = rows.reduce((sum, r) => sum + (r.s.total ?? 0), 0)
  const totalUnassigned = rows.reduce((sum, r) => sum + (r.s.unassigned ?? 0), 0)

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">TA Programmes</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Businesses from tenants who selected Innovation SL as their TA provider
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Tenants opted in',    value: tenants.length,    note: `of ${allTenantsCount} active` },
          { label: 'Total SMEs',          value: totalSMEs,         note: 'across all opted-in tenants' },
          { label: 'Unassigned SMEs',     value: totalUnassigned,   note: 'no focal person yet', alert: totalUnassigned > 0 },
          { label: 'Assigned SMEs',       value: totalSMEs - totalUnassigned, note: 'with focal person' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <p className={`text-2xl font-bold ${s.alert ? 'text-amber-600' : 'text-gray-900'}`}>{s.value}</p>
            <p className="text-xs font-medium text-gray-700 mt-0.5">{s.label}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{s.note}</p>
          </div>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <p className="text-sm font-medium text-gray-500">No tenants have opted in to Innovation SL TA yet.</p>
          <p className="text-xs text-gray-400 mt-1">Go to <Link href="/admin/tenants" className="text-purple-600 underline">Tenants</Link> and set the TA Provider to &quot;Innovation SL&quot; for any bank.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-[11px] text-gray-500 uppercase tracking-wide">
                <th className="text-left px-5 py-3">Tenant</th>
                <th className="text-left px-4 py-3">Plan</th>
                <th className="text-right px-4 py-3">SMEs</th>
                <th className="text-right px-4 py-3">Unassigned</th>
                <th className="text-right px-4 py-3">Avg score</th>
                <th className="text-left px-4 py-3">Classification mix</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map(row => {
                const pc = PLAN_COLOR[row.plan] ?? PLAN_COLOR.starter
                const hasUnassigned = row.s.unassigned > 0
                return (
                  <tr key={String(row._id)} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{row.name}</p>
                      <p className="text-[11px] text-gray-400">{row.slug}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: pc.bg, color: pc.text }}>
                        {row.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-800">{row.s.total}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-semibold text-sm ${hasUnassigned ? 'text-amber-600' : 'text-green-600'}`}>
                        {row.s.unassigned}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {row.s.avgScore ? `${Math.round(row.s.avgScore)}%` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {row.s.total > 0 ? (
                        <div className="flex items-center gap-2 text-[11px]">
                          {row.s.ir > 0  && <span className="text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full">{row.s.ir} IR</span>}
                          {row.s.cl > 0  && <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full">{row.s.cl} CL</span>}
                          {row.s.hr > 0  && <span className="text-red-700 bg-red-50 px-1.5 py-0.5 rounded-full">{row.s.hr} HR</span>}
                        </div>
                      ) : <span className="text-gray-300 text-xs">No diagnostics</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/ta/${String(row._id)}`}
                        className="text-xs font-semibold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Manage SMEs →
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
  )
}
