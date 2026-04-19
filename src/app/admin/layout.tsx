// src/app/admin/layout.tsx

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db'
import { User } from '@/models'
import AdminSidebar from '@/components/layout/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  await connectDB()

  const user = await User.findOne({ clerkId: userId }).lean() as any
  if (!user) redirect('/onboarding')
  if (user.role !== 'platform_admin') redirect('/dashboard')

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 min-w-0 bg-gray-50 pt-16 lg:pt-0">{children}</main>
    </div>
  )
}
