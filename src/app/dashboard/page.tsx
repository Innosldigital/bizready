// src/app/dashboard/page.tsx
// Role-based redirect hub - server component

import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db'
import { User } from '@/models'

function portalFor(role: string): string | null {
  if (role === 'platform_admin')                      return '/admin/dashboard'
  if (role === 'bank_admin' || role === 'bank_staff') return '/bank/dashboard'
  if (role === 'sme')                                 return '/sme/progress'
  return null
}

export default async function DashboardRedirect() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect('/sign-in')

  // Fast path - role already in session claims
  const metadata = sessionClaims?.metadata as Record<string, string> | undefined
  const claimRole = metadata?.role
  if (claimRole) {
    const dest = portalFor(claimRole)
    if (dest) redirect(dest)
  }

  // Slow path - check MongoDB
  try {
    await connectDB()
    const user = await User.findOne({ clerkId: userId }).lean() as any
    if (!user) redirect('/onboarding')

    const dest = portalFor(user.role)
    if (!dest) redirect('/onboarding')

    // Backfill Clerk metadata
    try {
      const clerk = await clerkClient()
      await clerk.users.updateUserMetadata(userId, {
        publicMetadata: { role: user.role },
      })
    } catch { /* non-fatal */ }

    redirect(dest)
  } catch {
    redirect('/onboarding')
  }
}
