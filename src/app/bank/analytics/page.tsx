import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db'
import { Business, Diagnostic, Tenant, User } from '@/models'
import type { AnalyticsBusinessSummary } from '@/types'
import AnalyticsDashboardClient from './AnalyticsDashboardClient'

export default async function BankAnalyticsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  await connectDB()

  const user = await User.findOne({ clerkId: userId }).lean() as any
  if (!user) redirect('/onboarding')
  if (!['bank_admin', 'bank_staff'].includes(user.role)) redirect('/dashboard')

  const tenant = await Tenant.findById(user.tenantId).lean() as any
  if (!tenant) redirect('/onboarding')

  const businessDocs = await Business.find({ tenantId: user.tenantId })
    .select('name sector ceoName')
    .sort({ name: 1 })
    .lean() as any[]

  const businesses: AnalyticsBusinessSummary[] = businessDocs.map((business) => ({
    id: String(business._id),
    name: business.name ?? 'Unknown Business',
    sector: business.sector ?? 'Unknown Sector',
    ceoName: business.ceoName ?? '',
  }))

  // Default date range: from the most recent diagnostic date for the first business
  const now = new Date()
  let defaultFrom = `${now.getFullYear() - 1}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  let defaultTo = now.toISOString().slice(0, 10)

  if (businesses[0]) {
    const latest = await Diagnostic.findOne({ tenantId: user.tenantId, businessId: businesses[0].id })
      .sort({ createdAt: -1 })
      .select('createdAt')
      .lean() as any
    if (latest?.createdAt) {
      const d = new Date(latest.createdAt)
      const dateStr = d.toISOString().slice(0, 10)
      defaultFrom = dateStr
      defaultTo = dateStr
    }
  }

  return (
    <AnalyticsDashboardClient
      bankName={tenant.theme?.bankName || tenant.name || 'BizReady'}
      businesses={businesses}
      defaultBusinessId={businesses[0]?.id ?? ''}
      defaultFrom={defaultFrom}
      defaultTo={defaultTo}
      tenantId={String(tenant._id)}
    />
  )
}
