import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db'
import { User, Tenant } from '@/models'

export default async function OnboardingPage() {
  const { userId } = await auth()

  if (!userId) redirect('/sign-in')

  await connectDB()

  // ── Already exists in DB — check setup status then redirect ──
  const existingUser = await User.findOne({ clerkId: userId }).lean() as any
  if (existingUser) {
    try {
      const clerk = await clerkClient()
      await clerk.users.updateUserMetadata(userId, {
        publicMetadata: { role: existingUser.role },
      })
    } catch { /* non-fatal */ }

    if (existingUser.role === 'platform_admin') redirect('/admin/dashboard')
    if (existingUser.role === 'sme')            redirect('/sme/progress')

    // bank_admin: check if they still need to complete bank setup
    // (their tenantId still points to the default 'innosl' tenant)
    if (existingUser.role === 'bank_admin') {
      const tenant = await Tenant.findById(existingUser.tenantId).lean() as any
      if (!tenant || tenant.slug === 'innosl') redirect('/onboarding/bank-setup')
    }

    redirect('/bank/dashboard')
  }

  // ── New user — fetch from Clerk to get email ──
  let userEmail = ''
  let userName  = ''
  try {
    const clerk     = await clerkClient()
    const clerkUser = await clerk.users.getUser(userId)
    userEmail = clerkUser.emailAddresses[0]?.emailAddress?.toLowerCase() || ''
    userName  = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || userEmail
  } catch (e) {
    console.error('[onboarding] Could not fetch Clerk user:', e)
    redirect('/sign-in')
  }

  // ── Determine role from PLATFORM_ADMIN_EMAILS env var ──
  const adminEmails = (process.env.PLATFORM_ADMIN_EMAILS || '')
    .split(',')
    .map((e: string) => e.trim().toLowerCase())
    .filter(Boolean)

  const role = adminEmails.includes(userEmail) ? 'platform_admin' : 'bank_admin'

  // ── Find default innosl tenant (temporary placeholder for bank_admin) ──
  const defaultTenant = await Tenant.findOne({ slug: 'innosl' }).lean() as any
  if (!defaultTenant) redirect('/onboarding/setup-required')

  // ── Create user in MongoDB ──
  try {
    await User.create({
      clerkId:  userId,
      email:    userEmail,
      name:     userName,
      role,
      tenantId: defaultTenant._id,
    })
  } catch (e: any) {
    // Duplicate key — parallel request beat us; fetch the existing record and redirect
    if (e.code === 11000) {
      const existing = await User.findOne({ clerkId: userId }).lean() as any
      if (existing?.role === 'platform_admin') redirect('/admin/dashboard')
      redirect('/onboarding/bank-setup')
    }
    throw e
  }

  // ── Write role to Clerk metadata ──
  try {
    const clerk = await clerkClient()
    await clerk.users.updateUserMetadata(userId, {
      publicMetadata: { role },
    })
  } catch { /* non-fatal */ }

  // ── Redirect: admins go straight to dashboard, bank admins complete setup ──
  if (role === 'platform_admin') redirect('/admin/dashboard')
  redirect('/onboarding/bank-setup')
}