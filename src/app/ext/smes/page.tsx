// src/app/ext/smes/page.tsx
// External viewer: read-only list of their assigned SMEs

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db'
import { User, Business, Diagnostic, TAProgramme } from '@/models'

const CLASS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  investment_ready:       { bg: '#E1F5EE', text: '#0F6E56', label: 'Investment Ready' },
  conditionally_lendable: { bg: '#FAEEDA', text: '#BA7517', label: 'Conditionally Lendable' },
  high_risk:              { bg: '#FCEBEB', text: '#A32D2D', label: 'High Risk' },
}

function indexColor(idx: number) {
  if (idx >= 80) return '#0F6E56'
  if (idx >= 60) return '#BA7517'
  return '#A32D2D'
}

function formatDate(d: any) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default async function ExtSMEsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  await connectDB()

  const user = await User.findOne({ clerkId: userId })
    .populate('assignedSMEs')
    .lean() as any

  if (!user || user.role !== 'external_viewer') redirect('/dashboard')

  const businesses: any[] = user.assignedSMEs ?? []
  const bizIds = businesses.map((b: any) => b._id)

  const [latestDiags, taCounts] = await Promise.all([
    Diagnostic.aggregate([
      { $match: { businessId: { $in: bizIds } } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$businessId', doc: { $first: '$$ROOT' }, total: { $sum: 1 } } },
    ]),
    TAProgramme.aggregate([
      { $match: { businessId: { $in: bizIds } } },
      { $group: { _id: '$businessId', active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } }, completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } } } },
    ]),
  ])

  const diagByBiz: Record<string, any> = {}
  for (const d of latestDiags) diagByBiz[String(d._id)] = d

  const taByBiz: Record<string, any> = {}
  for (const t of taCounts) taByBiz[String(t._id)] = t

  const investmentReady = businesses.filter((b: any) => {
    const d = diagByBiz[String(b._id)]
    return d?.doc?.result?.classification === 'investment_ready'
  }).length

  const avgIndex = (() => {
    const scored = businesses.filter((b: any) => diagByBiz[String(b._id)]?.doc?.result?.lendabilityIndex != null)
    if (!scored.length) return 0
    return Math.round(scored.reduce((s: number, b: any) => s + diagByBiz[String(b._id)].doc.result.lendabilityIndex, 0) / scored.length)
  })()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">SME Portfolio</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Read-only view of {businesses.length} assigned SME{businesses.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Assigned SMEs', value: businesses.length },
          { label: 'Average index', value: `${avgIndex}%` },
          { label: 'Investment ready', value: investmentReady },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">{s.label}</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {businesses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-sm font-medium text-gray-900 mb-1">No SMEs assigned</p>
          <p className="text-xs text-gray-400">Your account administrator will assign SMEs for you to view.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-900">Portfolio overview</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Business', 'Sector', 'Score', 'Classification', 'Active TAs', 'Completed TAs', 'Last assessment'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wide text-gray-400 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {businesses.map((biz: any) => {
                  const entry = diagByBiz[String(biz._id)]
                  const result = entry?.doc?.result
                  const idx = result?.lendabilityIndex ?? null
                  const cls = result?.classification ?? null
                  const badge = cls ? CLASS_BADGE[cls] : null
                  const ta = taByBiz[String(biz._id)] ?? {}

                  return (
                    <tr key={String(biz._id)} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{biz.name}</p>
                        {biz.location && <p className="text-[10px] text-gray-400">{biz.location}</p>}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{biz.sector}</td>
                      <td className="px-4 py-3">
                        {idx !== null
                          ? <span className="font-bold" style={{ color: indexColor(idx) }}>{idx}%</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {badge
                          ? <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: badge.bg, color: badge.text }}>{badge.label}</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{ta.active ?? 0}</td>
                      <td className="px-4 py-3 text-gray-700">{ta.completed ?? 0}</td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(entry?.doc?.createdAt)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
