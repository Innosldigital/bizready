// src/app/sme/ta/page.tsx
// SME Personal TA Programme Tracker

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { connectDB } from '@/lib/db'
import { User, TAProgramme, Business } from '@/models'

const statusBadge = (status: string) => {
  const map: Record<string, { bg: string; color: string }> = {
    upcoming:  { bg: '#EFF6FF', color: '#1D4ED8' },
    active:    { bg: '#E1F5EE', color: '#0F6E56' },
    completed: { bg: '#F0FDF4', color: '#166534' },
    paused:    { bg: '#FAEEDA', color: '#BA7517' },
  }
  const s = map[status] ?? { bg: '#F3F4F6', color: '#6B7280' }
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium capitalize"
      style={{ background: s.bg, color: s.color }}>
      {status}
    </span>
  )
}

const priorityBadge = (priority: string) => {
  const map: Record<string, { bg: string; color: string }> = {
    critical: { bg: '#FCEBEB', color: '#A32D2D' },
    high:     { bg: '#FEF3C7', color: '#B45309' },
    medium:   { bg: '#FAEEDA', color: '#BA7517' },
    low:      { bg: '#F3F4F6', color: '#6B7280' },
  }
  const s = map[priority] ?? { bg: '#F3F4F6', color: '#6B7280' }
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium capitalize"
      style={{ background: s.bg, color: s.color }}>
      {priority}
    </span>
  )
}

export default async function SMETAPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  await connectDB()

  const user = await User.findOne({ clerkId: userId }).lean() as any
  if (!user || user.role !== 'sme') redirect('/dashboard')

  if (!user.businessId) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">TA Programme</h1>
        <div className="bg-white rounded-xl p-8 border border-gray-100 text-center">
          <p className="text-sm text-gray-500 mb-4">Complete your diagnostic to receive TA recommendations.</p>
          <Link href="/sme/diagnostics"
            className="inline-block px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600">
            View diagnostics →
          </Link>
        </div>
      </div>
    )
  }

  const business = await Business.findById(user.businessId).lean() as any
  const programmes = await TAProgramme.find({ businessId: user.businessId })
    .sort({ createdAt: -1 })
    .lean() as any[]

  const active    = programmes.filter(p => p.status === 'active').length
  const completed = programmes.filter(p => p.status === 'completed').length
  const avgPct    = programmes.length > 0
    ? Math.round(programmes.reduce((s, p) => s + (p.progressPercent ?? 0), 0) / programmes.length)
    : 0

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">TA Programme</h1>
        <p className="text-sm text-gray-500">{business?.name} · Technical Assistance Tracker</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Active programmes',  value: active },
          { label: 'Completed',          value: completed },
          { label: 'Avg completion',     value: `${avgPct}%` },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-100 text-center">
            <p className="text-2xl font-semibold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {programmes.length === 0 ? (
        <div className="bg-white rounded-xl p-10 border border-gray-100 text-center">
          <p className="text-sm text-gray-400 mb-2">No TA programmes assigned yet.</p>
          <p className="text-xs text-gray-400">Your bank relationship manager will assign programmes after reviewing your diagnostic.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {programmes.map(prog => {
            const pct = prog.progressPercent ?? 0
            const expected = prog.startDate && prog.timeframeWeeks
              ? new Date(new Date(prog.startDate).getTime() + prog.timeframeWeeks * 7 * 24 * 60 * 60 * 1000)
                  .toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
              : '-'
            return (
              <div key={prog._id} className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-gray-900">{prog.area}</p>
                    <p className="text-xs text-gray-500 capitalize mt-0.5">{prog.capacityLevel} capacity</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0 ml-4">
                    {statusBadge(prog.status)}
                    {priorityBadge(prog.priority ?? 'medium')}
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-3">{prog.recommendation}</p>

                {/* Tools */}
                {prog.tools?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {prog.tools.map((t: string) => (
                      <span key={t} className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{t}</span>
                    ))}
                  </div>
                )}

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                    <span>Progress</span>
                    <span>{pct}% · Est. completion: {expected}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-2 rounded-full transition-all"
                      style={{ width: `${pct}%`, background: pct >= 100 ? '#0F6E56' : '#185FA5' }} />
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
