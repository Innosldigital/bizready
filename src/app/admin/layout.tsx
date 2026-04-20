// src/app/admin/layout.tsx

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db'
import { User } from '@/models'
import { isInnoSLRole, canViewAdminDashboard } from '@/lib/roles'
import AdminShell from '@/components/layout/AdminShell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  await connectDB()

  const user = await User.findOne({ clerkId: userId }).lean() as any
  if (!user) redirect('/onboarding')
  if (!isInnoSLRole(user.role)) redirect('/dashboard')
  if (!user.isActive) redirect('/onboarding')

  // external_viewer has their own portal at /ext
  if (user.role === 'external_viewer') redirect('/ext/smes')

  if (!canViewAdminDashboard(user.role)) redirect('/dashboard')

  return (
    <AdminShell userRole={user.role}>
      {children}
    </AdminShell>
  )
}
