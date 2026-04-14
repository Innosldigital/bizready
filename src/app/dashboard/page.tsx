// src/app/dashboard/page.tsx
// Role-based redirect — middleware sends here when role ≠ route being accessed
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db'
import { User } from '@/models'

export default async function DashboardRedirect() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect('/sign-in')

  // ── 1. Fast path: use Clerk session claims (no DB needed) ──
  // Role is written to Clerk metadata during onboarding, so most
  // requests resolve here without touching MongoDB.
  const role = (sessionClaims?.metadata as { role?: string })?.role

  if (role === 'platform_admin') redirect('/admin/dashboard')
  if (role === 'bank_admin' || role === 'bank_staff') redirect('/bank/dashboard')
  if (role === 'sme') redirect('/sme/progress')

  // ── 2. No role in claims yet — check MongoDB (first-time login) ──
  // If DB is unreachable, send to onboarding so the user can set up
  // their account and get a role assigned (which will populate claims).
  try {
    await connectDB()
    const user = await User.findOne({ clerkId: userId }).lean() as any

    if (!user) redirect('/onboarding')

    switch (user.role) {
      case 'platform_admin': redirect('/admin/dashboard')
      case 'bank_admin':
      case 'bank_staff':     redirect('/bank/dashboard')
      case 'sme':            redirect('/sme/progress')
      default:               redirect('/onboarding')
    }
  } catch {
    // DB unreachable — send to onboarding which will retry the connection
    redirect('/onboarding')
  }
}
