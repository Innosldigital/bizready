// src/app/admin/billing/page.tsx
// Platform billing & subscription management

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db'
import { User, Tenant } from '@/models'
import { PLANS } from '@/types'
import PlanControl from './PlanControl'

export default async function AdminBillingPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  await connectDB()

  const user = await User.findOne({ clerkId: userId }).lean() as any
  if (!user || user.role !== 'platform_admin') redirect('/dashboard')

  const tenants = await Tenant.find().sort({ createdAt: -1 }).lean() as any[]

  const activeTenants = tenants.filter(t => t.isActive && t.plan !== 'owner')
  const mrr = activeTenants.reduce((s, t) => s + (PLANS[t.plan as keyof typeof PLANS]?.price ?? 0), 0)
  const arr  = mrr * 12

  const planCounts = tenants.reduce((acc, t) => {
    acc[t.plan] = (acc[t.plan] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  const planColors: Record<string, string> = {
    starter:    '#6B7280',
    growth:     '#185FA5',
    enterprise: '#7C3AED',
    owner:      '#BA7517',
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Billing & Revenue</h1>
        <p className="text-sm text-gray-500">Platform subscription and revenue overview</p>
      </div>

      {/* Revenue metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Monthly MRR',       value: `$${mrr.toLocaleString()}` },
          { label: 'Annual ARR',        value: `$${arr.toLocaleString()}` },
          { label: 'Paying tenants',    value: activeTenants.length },
          { label: 'Total tenants',     value: tenants.length },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-2xl font-semibold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Plan distribution */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Plan distribution</h2>
        <div className="flex gap-4 flex-wrap">
          {Object.entries(PLANS).map(([key, plan]) => (
            <div key={key} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ background: planColors[key] }} />
              <span className="text-sm text-gray-600">{plan.name}</span>
              <span className="text-sm font-semibold text-gray-900">{planCounts[key] ?? 0}</span>
              {plan.price > 0 && (
                <span className="text-xs text-gray-400">(${plan.price}/mo)</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tenants table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-900">All subscriptions</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-2.5">Tenant</th>
              <th className="text-left px-3 py-2.5">Plan / Status</th>
              <th className="text-right px-3 py-2.5">MRR</th>
              <th className="text-right px-3 py-2.5">Diagnostics</th>
              <th className="text-left px-3 py-2.5">Stripe ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {tenants.map(t => (
              <tr key={String(t._id)} className="hover:bg-gray-50/50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-800">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.slug}</p>
                </td>
                <td className="px-3 py-3">
                  <PlanControl
                    tenantId={String(t._id)}
                    currentPlan={t.plan as any}
                    isActive={!!t.isActive}
                  />
                </td>
                <td className="px-3 py-3 text-right font-medium text-gray-800">
                  {t.plan === 'owner' ? '-' : `$${PLANS[t.plan as keyof typeof PLANS]?.price ?? 0}`}
                </td>
                <td className="px-3 py-3 text-right text-gray-600">{t.totalSubmissions ?? 0}</td>
                <td className="px-3 py-3 text-xs text-gray-400 font-mono">
                  {t.stripeCustomerId ?? 'Not set'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
