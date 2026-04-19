// src/app/sme/ta/page.tsx
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { connectDB } from '@/lib/db'
import { User, TAProgramme, Business } from '@/models'

function statusStyle(status: string) {
  const map: Record<string, { bg: string; color: string; dot: string }> = {
    upcoming:  { bg: '#EFF6FF', color: '#1D4ED8', dot: '#3B82F6' },
    active:    { bg: '#E1F5EE', color: '#0F6E56', dot: '#10B981' },
    completed: { bg: '#F0FDF4', color: '#166534', dot: '#22C55E' },
    paused:    { bg: '#FAEEDA', color: '#BA7517', dot: '#F59E0B' },
  }
  return map[status] ?? { bg: '#F3F4F6', color: '#6B7280', dot: '#9CA3AF' }
}

function priorityStyle(priority: string) {
  const map: Record<string, { bg: string; color: string }> = {
    critical: { bg: '#FCEBEB', color: '#A32D2D' },
    high:     { bg: '#FEF3C7', color: '#B45309' },
    medium:   { bg: '#FAEEDA', color: '#BA7517' },
    low:      { bg: '#F3F4F6', color: '#6B7280' },
  }
  return map[priority] ?? { bg: '#F3F4F6', color: '#6B7280' }
}

function progressColor(pct: number) {
  if (pct >= 100) return '#0F6E56'
  if (pct >= 60)  return '#185FA5'
  return '#5B1FA8'
}

export default async function SMETAPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  await connectDB()

  const user = await User.findOne({ clerkId: userId }).lean() as any
  if (!user || user.role !== 'sme') redirect('/dashboard')

  if (!user.businessId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Programmes</h1>
          <p className="text-sm text-gray-500 mt-1">Technical Assistance Tracker</p>
        </div>
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200/60 p-16 text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center text-3xl"
            style={{ background: 'linear-gradient(135deg,#EFF6FF,#F0FDF4)' }}>
            🎯
          </div>
          <h2 className="text-base font-semibold text-gray-900 mb-2">No programmes yet</h2>
          <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto leading-relaxed">
            Complete a diagnostic to unlock personalised TA programme recommendations.
          </p>
          <Link href="/sme/diagnostics"
            className="inline-block px-6 py-2.5 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#5B1FA8,#185FA5)' }}>
            View assessments
          </Link>
        </div>
      </div>
    )
  }

  const business   = await Business.findById(user.businessId).lean() as any
  const programmes = await TAProgramme.find({ businessId: user.businessId })
    .sort({ createdAt: -1 })
    .lean() as any[]

  const active    = programmes.filter(p => p.status === 'active')
  const upcoming  = programmes.filter(p => p.status === 'upcoming')
  const completed = programmes.filter(p => p.status === 'completed')
  const paused    = programmes.filter(p => p.status === 'paused')

  const avgPct = programmes.length > 0
    ? Math.round(programmes.reduce((s, p) => s + (p.progressPercent ?? 0), 0) / programmes.length)
    : 0

  const stats = [
    { label: 'Active',    value: active.length,    color: '#0F6E56' },
    { label: 'Upcoming',  value: upcoming.length,   color: '#1D4ED8' },
    { label: 'Completed', value: completed.length,  color: '#166534' },
    { label: 'Avg. progress', value: `${avgPct}%`, color: '#5B1FA8' },
  ]

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Programmes</h1>
        <p className="text-sm text-gray-500 mt-1">{business?.name} · Technical Assistance Tracker</p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-5">
            <p className="text-3xl font-thin leading-none mb-1" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {programmes.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200/60 p-14 text-center">
          <p className="text-sm text-gray-400 mb-1">No TA programmes assigned yet.</p>
          <p className="text-xs text-gray-400">Your relationship manager will assign programmes after reviewing your diagnostic.</p>
        </div>
      ) : (
        <div className="space-y-4">

          {/* Active programmes */}
          {active.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
                Active · {active.length}
              </h2>
              <div className="space-y-3">
                {active.map(prog => <ProgrammeCard key={prog._id} prog={prog} />)}
              </div>
            </section>
          )}

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
                Upcoming · {upcoming.length}
              </h2>
              <div className="space-y-3">
                {upcoming.map(prog => <ProgrammeCard key={prog._id} prog={prog} />)}
              </div>
            </section>
          )}

          {/* Paused */}
          {paused.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
                Paused · {paused.length}
              </h2>
              <div className="space-y-3">
                {paused.map(prog => <ProgrammeCard key={prog._id} prog={prog} />)}
              </div>
            </section>
          )}

          {/* Completed */}
          {completed.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
                Completed · {completed.length}
              </h2>
              <div className="space-y-3">
                {completed.map(prog => <ProgrammeCard key={prog._id} prog={prog} />)}
              </div>
            </section>
          )}

        </div>
      )}
    </div>
  )
}

function ProgrammeCard({ prog }: { prog: any }) {
  const pct      = prog.progressPercent ?? 0
  const ss       = statusStyle(prog.status)
  const ps       = priorityStyle(prog.priority ?? 'medium')
  const endDate  = prog.startDate && prog.timeframeWeeks
    ? formatDate(new Date(new Date(prog.startDate).getTime() + prog.timeframeWeeks * 7 * 86400 * 1000))
    : null

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-200/60 p-6">

      {/* Top row */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ss.dot }} />
            <h3 className="text-sm font-semibold text-gray-900 truncate">{prog.area}</h3>
          </div>
          <p className="text-xs text-gray-500 capitalize pl-4">{prog.capacityLevel} capacity</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold capitalize"
            style={{ background: ss.bg, color: ss.color }}>
            {prog.status}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold capitalize"
            style={{ background: ps.bg, color: ps.color }}>
            {prog.priority ?? 'medium'}
          </span>
        </div>
      </div>

      {/* Recommendation */}
      {prog.recommendation && (
        <p className="text-sm text-gray-600 leading-relaxed mb-4">{prog.recommendation}</p>
      )}

      {/* Tools */}
      {prog.tools?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {prog.tools.map((t: string) => (
            <span key={t} className="text-[10px] px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full font-medium">{t}</span>
          ))}
        </div>
      )}

      {/* Progress bar */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-medium text-gray-500">Progress</span>
          <div className="flex items-center gap-3">
            {endDate && (
              <span className="text-[10px] text-gray-400">Est. completion: {endDate}</span>
            )}
            <span className="text-xs font-semibold" style={{ color: progressColor(pct) }}>{pct}%</span>
          </div>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: progressColor(pct) }} />
        </div>
      </div>

    </div>
  )
}

function formatDate(d: any) {
  if (!d) return null
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
