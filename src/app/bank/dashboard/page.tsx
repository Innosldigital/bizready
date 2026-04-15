import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db'
import { User, Tenant } from '@/models'

export default async function BankDashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  await connectDB()
  const user = await User.findOne({ clerkId: userId }).lean() as any
  const tenant = await Tenant.findById(user.tenantId).lean() as any

  const theme = tenant.theme

  const stats = [
    { label: 'Total Submissions', value: '0', icon: '▣', color: theme.primary },
    { label: 'Average Score', value: '0%', icon: '▲', color: theme.accent },
    { label: 'Ready for Funding', value: '0', icon: '◈', color: '#0F6E56' },
    { label: 'Active Programmes', value: '0', icon: '□', color: theme.primaryDark },
  ]

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome back, {user.name}</h1>
          <p className="text-sm text-gray-500">{theme.bankName} · {theme.tagline || 'SME Investment Readiness'}</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            Download Reports
          </button>
          <button className="px-4 py-2 text-white rounded-lg text-sm font-medium shadow-sm hover:opacity-90 transition-opacity" style={{ background: theme.primary }}>
            + New Programme
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ background: `${stat.color}15`, color: stat.color }}>
                {stat.icon}
              </div>
              <span className="text-sm font-medium text-gray-500">{stat.label}</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Main Content Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center">
            <h2 className="font-semibold text-gray-900">Recent Submissions</h2>
            <button className="text-xs font-medium hover:underline" style={{ color: theme.primary }}>View all</button>
          </div>
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl text-gray-300">
              ≡
            </div>
            <p className="text-sm text-gray-500">No submissions yet. Share your diagnostic link to get started.</p>
            <div className="mt-6 inline-block px-4 py-2 bg-gray-50 rounded-lg border border-gray-100 text-xs font-mono text-gray-400">
              /diagnostic/{tenant.slug}
            </div>
          </div>
        </div>

        {/* Readiness Distribution */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900">Readiness Distribution</h2>
          </div>
          <div className="p-8 text-center">
            <div className="w-32 h-32 border-8 border-gray-50 rounded-full mx-auto mb-6 flex items-center justify-center">
              <span className="text-xs text-gray-300 font-medium italic">Empty</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" /> Investment Ready
                </span>
                <span className="font-bold text-gray-900">0%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500" /> Conditionally Lendable
                </span>
                <span className="font-bold text-gray-900">0%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rose-500" /> High Risk
                </span>
                <span className="font-bold text-gray-900">0%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
