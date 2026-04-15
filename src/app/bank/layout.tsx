// src/app/bank/layout.tsx

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db'
import { User, Tenant } from '@/models'
import { generateThemeCSS } from '@/lib/theme'
import BankSidebar from '@/components/layout/BankSidebar'

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
      <div className="flex min-h-screen">
        <BankSidebar tenant={tenant} userRole={user.role} />
        <main className="flex-1 min-w-0 bg-gray-50">{children}</main>
      </div>
    </>
  )
}