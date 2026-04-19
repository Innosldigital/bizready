// src/app/admin/diagnostics/page.tsx
// Platform-wide diagnostics table for super admin

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { connectDB } from '@/lib/db'
import { User, Diagnostic, Tenant } from '@/models'
import { classifyGap, gapColor, gapLabel } from '@/types'

export default async function AdminDiagnosticsPage({
  searchParams,
}: { searchParams: { page?: string; tenantId?: string } }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  await connectDB()

  const user = await User.findOne({ clerkId: userId }).lean() as any
  if (!user || user.role !== 'platform_admin') redirect('/dashboard')

  const page = Math.max(1, Number(searchParams?.page ?? 1))
  const limit = 25
  const tenantId = searchParams?.tenantId || ''
  const query: Record<string, unknown> = { 'result.lendabilityIndex': { $exists: true } }

  if (tenantId) {
    query.tenantId = tenantId
  }

  const [diagnostics, total, selectedTenant] = await Promise.all([
    Diagnostic.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('businessId')
      .populate('tenantId')
      .lean()
      .exec() as unknown as any[],
    Diagnostic.countDocuments(query),
    tenantId ? Tenant.findById(tenantId).lean().exec() as unknown as any : Promise.resolve(null),
  ])

  const pages = Math.ceil(total / limit)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">All Diagnostics</h1>
          <p className="text-sm text-gray-500">
            {tenantId && selectedTenant
              ? `${total.toLocaleString()} scored submissions for ${selectedTenant.name}`
              : `${total.toLocaleString()} scored submissions across all tenants`}
          </p>
        </div>
        {tenantId ? (
          <Link
            href="/admin/diagnostics"
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50"
          >
            Clear tenant filter
          </Link>
        ) : (
          <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50">
            Export CSV
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr className="text-xs text-gray-500 uppercase tracking-wide">
              <th className="text-left px-4 py-3">Tenant</th>
              <th className="text-left px-4 py-3">Business</th>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-right px-3 py-3">Index</th>
              <th className="text-right px-3 py-3">Strategic</th>
              <th className="text-right px-3 py-3">Process</th>
              <th className="text-right px-3 py-3">Support</th>
              <th className="text-left px-3 py-3">Classification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {diagnostics.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-400">No diagnostics found.</td></tr>
            ) : diagnostics.map((d: any) => {
              const biz = d.businessId as any
              const ten = d.tenantId as any
              const idx = d.result?.lendabilityIndex ?? 0
              const sp  = d.result?.strategic?.percentage ?? 0
              const pp  = (d.result?.process ?? d.result?.operational)?.percentage ?? 0
              const sup = d.result?.support?.percentage ?? 0
              const g   = classifyGap(idx)
              const date = new Date(d.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

              return (
                <tr key={d._id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {ten?.theme?.abbreviation ?? '?'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800 truncate max-w-[160px]">{biz?.name ?? '-'}</p>
                    <p className="text-xs text-gray-400">{biz?.sector ?? '-'}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{date}</td>
                  <td className="px-3 py-3 text-right font-semibold" style={{ color: gapColor(g) }}>{idx}%</td>
                  <td className="px-3 py-3 text-right text-gray-600">{sp}%</td>
                  <td className="px-3 py-3 text-right text-gray-600">{pp}%</td>
                  <td className="px-3 py-3 text-right text-gray-600">{sup}%</td>
                  <td className="px-3 py-3">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ background: g === 'high_priority_gap' ? '#FCEBEB' : g === 'low_priority_gap' ? '#FAEEDA' : '#E1F5EE', color: gapColor(g) }}>
                      {gapLabel(g)}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
            <Link
              key={p}
              href={tenantId ? `?page=${p}&tenantId=${tenantId}` : `?page=${p}`}
              className={`px-3 py-1.5 rounded-lg text-xs ${p === page ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
