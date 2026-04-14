// src/app/dashboard/page.tsx
// Role-based redirect — middleware sends here when role ≠ route being accessed
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db'
import { User } from '@/models'

export default async function DashboardRedirect() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  await connectDB()

  const user = await User.findOne({ clerkId: userId }).lean() as any

  if (!user) redirect('/onboarding')

  switch (user.role) {
    case 'platform_admin': redirect('/admin/dashboard')
    case 'bank_admin':
    case 'bank_staff':     redirect('/bank/dashboard')
    case 'sme':            redirect('/sme/progress')
    default:               redirect('/sign-in')
  }
}
