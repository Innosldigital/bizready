// src/app/bank/ta/page.tsx
// Technical Assistance Portfolio - server component

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db'
import { User, Tenant, TAProgramme } from '@/models'
import Link from 'next/link'

function statusBadge(status: string) {
  const map: Record<string, { label: string; bg: string; text: string }> = {
    upcoming: { label: 'Upcoming', bg: '#F3F4F6', text: '#374151' },
    active: { label: 'Active', bg: '#DBEAFE', text: '#1D4ED8' },
    completed: { label: 'Completed', bg: '#D1FAE5', text: '#065F46' },
    paused: { label: 'Paused', bg: '#FEF3C7', text: '#92400E' },
  }
  const s = map[status] ?? map.upcoming
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  )
}

function priorityBadge(priority: string) {
  const map: Record<string, { label: string; bg: string; text: string }> = {
    critical: { label: 'Critical', bg: '#FCEBEB', text: '#A32D2D' },
    high: { label: 'High', bg: '#FEF0E4', text: '#C04A00' },
    medium: { label: 'Medium', bg: '#FEFCE8', text: '#78350F' },
    low: { label: 'Low', bg: '#F3F4F6', text: '#374151' },
  }
  const p = map[priority] ?? map.medium
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: p.bg, color: p.text }}
    >
      {p.label}
    </span>
  )
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function expectedCompletion(startDate: Date | string | null | undefined, weeks: number): string {
  if (!startDate) return '-'
  const d = new Date(startDate)
  d.setDate(d.getDate() + weeks * 7)
  return formatDate(d)
}

function isThisMonth(date: Date | string | null | undefined): boolean {
  if (!date) return false
  const d = new Date(date)
  const now = new Date()
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

export default async function TAProgrammeTrackerPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  await connectDB()
  const user = await User.findOne({ clerkId: userId }).lean() as any
  if (!user) redirect('/onboarding')
  const tenant = await Tenant.findById(user.tenantId).lean() as any
  if (!tenant) redirect('/onboarding')

  const tenantId = user.tenantId

  const rawProgrammes = await TAProgramme.find({ tenantId })
    .populate('businessId', 'name _id')
    .sort({ createdAt: -1 })
    .lean() as any[]

  const programmes = rawProgrammes

  const totalActive = programmes.filter((p: any) => p.status === 'active').length
  const avgCompletion = programmes.length > 0
    ? Math.round(programmes.reduce((s: number, p: any) => s + (p.progressPercent ?? 0), 0) / programmes.length)
    : 0
  const highPriorityUnresolved = programmes.filter(
    (p: any) => ['critical', 'high'].includes(p.priority) && p.status !== 'completed',
  ).length
  const completedThisMonth = programmes.filter(
    (p: any) => p.status === 'completed' && isThisMonth(p.completedDate),
  ).length

  const theme = tenant.theme

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6 lg:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 mb-1">TA Programme Tracker</h1>
          <p className="text-sm text-gray-500 mt-1">{tenant.name} - Active TA interventions</p>
        </div>
        <a
          href="/api/bank/ta/export"
          className="px-4 py-2 rounded-lg text-sm font-medium shadow-sm border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 w-full sm:w-auto text-center"
        >
          Export CSV
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 lg:mb-8">
        {[
          { label: 'Total Active', value: totalActive, icon: 'GO', color: theme.primary },
          { label: 'Avg Completion', value: `${avgCompletion}%`, icon: 'OK', color: '#0F6E56' },
          { label: 'High Priority Unresolved', value: highPriorityUnresolved, icon: '!', color: '#A32D2D' },
          { label: 'Completed This Month', value: completedThisMonth, icon: 'DN', color: '#065F46' },
        ].map(stat => (
          <div key={stat.label} className="bg-white p-4 lg:p-5 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: `${stat.color}15`, color: stat.color }}
              >
                {stat.icon}
              </div>
              <span className="text-xs text-gray-500 leading-tight">{stat.label}</span>
            </div>
            <div className="text-xl lg:text-2xl font-bold text-gray-900">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 lg:px-6 py-4 border-b border-gray-50">
          <h2 className="font-semibold text-gray-900 text-sm">All Programmes ({programmes.length})</h2>
        </div>

        {programmes.length === 0 ? (
          <div className="p-8 lg:p-16 text-center">
            <div className="w-12 lg:w-14 h-12 lg:h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-sm font-semibold text-gray-300">TA</div>
            <p className="text-sm text-gray-500 mb-1">No TA programmes yet</p>
            <p className="text-xs text-gray-400">
              TA programmes are auto-created when an SME completes a diagnostic with high-priority gaps.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="text-left text-xs text-gray-500 font-medium border-b border-gray-100 bg-gray-50">
                  <th className="px-4 lg:px-6 py-3">Business</th>
                  <th className="px-3 lg:px-4 py-3">Level</th>
                  <th className="px-3 lg:px-4 py-3">Area</th>
                  <th className="px-3 lg:px-4 py-3">Priority</th>
                  <th className="px-3 lg:px-4 py-3">Start Date</th>
                  <th className="px-3 lg:px-4 py-3">Expected End</th>
                  <th className="px-3 lg:px-4 py-3">Progress</th>
                  <th className="px-3 lg:px-4 py-3">Status</th>
                  <th className="px-3 lg:px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {programmes.map((prog: any) => {
                  const business = prog.businessId
                  const bizName = typeof business === 'object' ? business?.name : 'Unknown'
                  const bizId = typeof business === 'object' ? business?._id?.toString() : null
                  const pct = prog.progressPercent ?? 0
                  const barColor = pct >= 80 ? '#0F6E56' : pct >= 50 ? '#BA7517' : '#A32D2D'

                  return (
                    <tr key={prog._id?.toString()} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 lg:px-6 py-4">
                        <span className="font-medium text-gray-900">{bizName}</span>
                      </td>
                      <td className="px-3 lg:px-4 py-4">
                        <span className="capitalize text-gray-600 text-xs">{prog.capacityLevel}</span>
                      </td>
                      <td className="px-3 lg:px-4 py-4 max-w-[180px]">
                        <span className="text-gray-700 text-xs leading-snug line-clamp-2">{prog.area}</span>
                      </td>
                      <td className="px-3 lg:px-4 py-4">{priorityBadge(prog.priority ?? 'medium')}</td>
                      <td className="px-3 lg:px-4 py-4 text-gray-600 text-xs whitespace-nowrap">
                        {formatDate(prog.startDate)}
                      </td>
                      <td className="px-3 lg:px-4 py-4 text-gray-600 text-xs whitespace-nowrap">
                        {expectedCompletion(prog.startDate, prog.timeframeWeeks ?? 4)}
                      </td>
                      <td className="px-3 lg:px-4 py-4">
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${pct}%`, background: barColor }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-8 text-right">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-3 lg:px-4 py-4">{statusBadge(prog.status ?? 'upcoming')}</td>
                      <td className="px-3 lg:px-4 py-4">
                        {bizId ? (
                          <Link
                            href={`/bank/ta/diagnosis/${bizId}`}
                            className="text-xs font-medium hover:underline"
                            style={{ color: theme.primary }}
                          >
                            View
                          </Link>
                        ) : (
                          <span className="text-xs text-gray-300">-</span>
                        )}
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
