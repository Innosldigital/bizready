// src/app/dashboard/page.tsx
// Role-based redirect — middleware sends here when role ≠ route being accessed
import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db'
import { User } from '@/models'

function portalFor(role: string) {
  if (role === 'platform_admin')              return '/admin/dashboard'
  if (role === 'bank_admin' || role === 'bank_staff') return '/bank/dashboard'
  if (role === 'sme')                         return '/sme/progress'
  return null
}

export default async function DashboardRedirect() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect('/sign-in')

  // ── 1. Fast path: role already in Clerk session claims (no DB) ──
  const claimRole = (sessionClaims?.metadata as { role?: string })?.role
  const portal = claimRole ? portalFor(claimRole) : null
  if (portal) redirect(portal)

  // ── 2. Role missing from claims — look up MongoDB ──────────────
  // This handles users who existed before Clerk metadata sync was added.
  // We find their role in MongoDB, backfill Clerk metadata so claims are
  // populated on their next request, then redirect them immediately.
  try {
    await connectDB()
    const user = await User.findOne({ clerkId: userId }).lean() as any

    if (!user) redirect('/onboarding')

    const dest = portalFor(user.role)
    if (!dest) redirect('/onboarding')

    // Backfill Clerk metadata so this DB lookup never runs again
    try {
      const clerk = await clerkClient()
      await clerk.users.updateUserMetadata(userId, {
        publicMetadata: { role: user.role },
      })
    } catch {
      // Non-fatal: metadata sync failed but we can still redirect
    }

    redirect(dest)
  } catch {
    // DB unreachable — send to onboarding to retry
    redirect('/onboarding')
  }
}
