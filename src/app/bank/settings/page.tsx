// src/app/bank/settings/page.tsx
// Server component wrapper - fetches tenant data and passes to interactive client component

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db'
import { User, Tenant } from '@/models'
import SettingsClient from './SettingsClient'

export default async function BankSettingsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  await connectDB()
  const user   = await User.findOne({ clerkId: userId }).lean() as any
  if (!user) redirect('/onboarding')
  const tenant = await Tenant.findById(user.tenantId).lean() as any
  if (!tenant) redirect('/onboarding')

  // Serialise to a plain object safe for client component props
  const tenantData = {
    _id:          tenant._id.toString(),
    slug:         tenant.slug,
    name:         tenant.name,
    plan:         tenant.plan ?? 'starter',
    contactEmail: tenant.contactEmail,
    country:      tenant.country ?? 'Sierra Leone',
    submissionsThisMonth: tenant.submissionsThisMonth ?? 0,
    totalSubmissions: tenant.totalSubmissions ?? 0,
    customDomain: tenant.customDomain ?? undefined,
    successManagerName:  tenant.successManagerName  ?? undefined,
    successManagerEmail: tenant.successManagerEmail ?? undefined,
    scoringWeights: tenant.scoringWeights
      ? { strategic: tenant.scoringWeights.strategic, process: tenant.scoringWeights.process, support: tenant.scoringWeights.support }
      : undefined,
    theme: {
      primary:       tenant.theme.primary,
      primaryLight:  tenant.theme.primaryLight,
      primaryDark:   tenant.theme.primaryDark,
      accent:        tenant.theme.accent,
      fontFamily:    tenant.theme.fontFamily ?? 'Inter',
      logoUrl:       tenant.theme.logoUrl ?? undefined,
      bankName:      tenant.theme.bankName,
      abbreviation:  tenant.theme.abbreviation,
      tagline:       tenant.theme.tagline ?? undefined,
    },
  }

  return <SettingsClient tenant={tenantData} />
}
