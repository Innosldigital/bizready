// src/app/admin/my-smes/page.tsx
// Focal Person / Project Manager view of assigned (or all) SMEs

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { connectDB } from '@/lib/db'
import { User, Business, Diagnostic, TAProgramme } from '@/models'
import { canViewAllDiagnostics, hasSMEAssignments } from '@/lib/roles'

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

export default async function MySMEsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  await connectDB()

  const user = await User.findOne({ clerkId: userId })
    .populate('assignedSMEs')
    .lean() as any

  if (!user) redirect('/sign-in')

  const canViewAll = canViewAllDiagnostics(user.role)
  const hasAssigned = hasSMEAssignments(user.role)

  // platform_admin and innosl_admin → redirect to diagnostics (they see everything there)
  if (!canViewAll && !hasAssigned) redirect('/admin/dashboard')

  let businesses: any[]
  if (canViewAll) {
    businesses = await Business.find({}).sort({ name: 1 }).lean()
  } else {
    businesses = (user.assignedSMEs ?? []) as any[]
  }

  const bizIds = businesses.map((b: any) => b._id)

  const [latestDiagnostics, taProgs] = await Promise.all([
    Diagnostic.aggregate([
      { $match: { businessId: { $in: bizIds } } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$businessId', doc: { $first: '$$ROOT' } } },
    ]),
    TAProgramme.find({ businessId: { $in: bizIds } }).lean(),
  ])

  const diagByBiz: Record<string, any> = {}
  for (const d of latestDiagnostics) diagByBiz[String(d._id)] = d.doc

  const taByBiz: Record<string, any[]> = {}
  for (const t of taProgs) {
    const key = String(t.businessId)
    if (!taByBiz[key]) taByBiz[key] = []
    taByBiz[key].push(t)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">
          {canViewAll ? 'All SMEs' : 'My Assigned SMEs'}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {canViewAll
            ? `${businesses.length} SMEs across all tenants`
            : `${businesses.length} SME${businesses.length !== 1 ? 's' : ''} assigned to you`}
        </p>
      </div>

      {businesses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-sm font-medium text-gray-900 mb-1">No SMEs assigned yet</p>
          <p className="text-xs text-gray-400">Ask a Super Admin to assign SMEs to your account.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {businesses.map((biz: any) => {
            const diag = diagByBiz[String(biz._id)]
            const result = diag?.result
            const idx = result?.lendabilityIndex ?? null
            const cls = result?.classification ?? null
            const badge = cls ? CLASS_BADGE[cls] : null
            const tas = taByBiz[String(biz._id)] ?? []
            const activeTAs = tas.filter((t: any) => t.status === 'active').length

            return (
              <div key={String(biz._id)}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{biz.name}</p>
                    <p className="text-xs text-gray-400">{biz.sector}</p>
                    {biz.location && (
                      <p className="text-[10px] text-gray-400 mt-0.5">{biz.location}</p>
                    )}
                  </div>
                  {idx !== null ? (
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xl font-bold" style={{ color: indexColor(idx) }}>{idx}%</p>
                      {badge && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                          style={{ background: badge.bg, color: badge.text }}>
                          {badge.label}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[10px] text-gray-400">No score yet</span>
                  )}
                </div>

                {result && (
                  <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                    {[
                      { label: 'Strategic', val: result.strategic?.percentage },
                      { label: 'Process', val: result.process?.percentage },
                      { label: 'Support', val: result.support?.percentage },
                    ].map(({ label, val }) => (
                      <div key={label} className="bg-gray-50 rounded-lg py-1.5">
                        <p className="font-semibold text-gray-700">{val ?? '—'}%</p>
                        <p className="text-gray-400">{label}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-gray-50">
                  <span>{activeTAs} active TA{activeTAs !== 1 ? 's' : ''}</span>
                  <div className="flex gap-2">
                    <Link href={`/bank/sme/${biz._id}`}
                      className="text-violet-700 hover:text-violet-900 font-medium">
                      View profile
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
