// src/app/bank/onboarding-setup/page.tsx
// White-glove onboarding checklist for new banks (Enterprise plan)
// Also accessible to any bank that hasn't finished setup.

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db'
import { User, Tenant, Business, Diagnostic } from '@/models'
import OnboardingChecklistClient from './OnboardingChecklistClient'

export default async function OnboardingSetupPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  await connectDB()
  const user   = await User.findOne({ clerkId: userId }).lean() as any
  if (!user) redirect('/onboarding')
  const tenant = await Tenant.findById(user.tenantId).lean() as any
  if (!tenant) redirect('/onboarding')

  // Auto-detect step completion from live data
  const diagnosticsCount  = await Diagnostic.countDocuments({ tenantId: user.tenantId })
  const hasTheme          = !!(tenant.theme?.primary && tenant.theme?.bankName)
  const hasTestDiagnostic = diagnosticsCount > 0

  // Merge auto-detected with manually confirmed steps
  const completedSteps: string[] = [...(tenant.onboardingSteps ?? [])]
  if (hasTheme          && !completedSteps.includes('theme_configured'))   completedSteps.push('theme_configured')
  if (hasTestDiagnostic && !completedSteps.includes('test_diagnostic'))    completedSteps.push('test_diagnostic')

  const isEnterprise = ['enterprise', 'owner'].includes(tenant.plan)

  return (
    <OnboardingChecklistClient
      tenantName={tenant.theme?.bankName ?? tenant.name}
      tenantSlug={tenant.slug}
      plan={tenant.plan}
      completedSteps={completedSteps}
      isEnterprise={isEnterprise}
      successManagerName={tenant.successManagerName}
      successManagerEmail={tenant.successManagerEmail}
      primaryColor={tenant.theme?.primary ?? '#5B1FA8'}
    />
  )
}
