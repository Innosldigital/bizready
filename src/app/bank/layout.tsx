// src/app/bank/layout.tsx

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db'
import { User, Tenant } from '@/models'
import { generateThemeCSS } from '@/lib/theme'
import BankShell from '@/components/layout/BankShell'

export default async function BankLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  await connectDB()

  const user = await User.findOne({ clerkId: userId }).lean() as any
  if (!user) redirect('/onboarding')
  if (!['bank_admin', 'bank_staff'].includes(user.role)) redirect('/dashboard')

  const tenant = await Tenant.findById(user.tenantId).lean() as any
  if (!tenant) redirect('/onboarding')

  const themeCSS = generateThemeCSS(tenant.theme as any)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: themeCSS }} />
      <BankShell tenant={JSON.parse(JSON.stringify(tenant))} userRole={user.role}>
        {children}
      </BankShell>
    </>
  )
}
