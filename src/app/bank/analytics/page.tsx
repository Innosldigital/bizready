import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db'
import { Business, Tenant, User } from '@/models'
import type { AnalyticsBusinessSummary } from '@/types'
import AnalyticsDashboardClient from './AnalyticsDashboardClient'

function formatInputDate(date: Date) {
  return date.toISOString().slice(0, 7) // YYYY-MM for month picker
}

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

  const defaultTo = formatInputDate(new Date())
  const defaultFromDate = new Date()
  defaultFromDate.setFullYear(defaultFromDate.getFullYear() - 1)
  const defaultFrom = formatInputDate(defaultFromDate)

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
