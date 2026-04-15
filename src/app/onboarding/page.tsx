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
    // ── Determine current intended role from PLATFORM_ADMIN_EMAILS ──
    const adminEmails = (process.env.PLATFORM_ADMIN_EMAILS || '')
      .split(',')
      .map((e: string) => e.trim().toLowerCase())
      .filter(Boolean)
    
    // Fetch user email from Clerk to be sure
    let currentUserEmail = existingUser.email
    try {
      const clerk     = await clerkClient()
      const clerkUser = await clerk.users.getUser(userId)
      currentUserEmail = clerkUser.emailAddresses[0]?.emailAddress?.toLowerCase() || existingUser.email
    } catch { /* fallback to DB email */ }

    const intendedRole = adminEmails.includes(currentUserEmail) ? 'platform_admin' : existingUser.role

    // If role has changed (e.g. user added to PLATFORM_ADMIN_EMAILS), update it
    if (intendedRole !== existingUser.role) {
      await User.updateOne({ clerkId: userId }, { role: intendedRole })
      existingUser.role = intendedRole
    }

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

  // ── Super Admin Check — Skip onboarding and redirect to admin dashboard ──
  if (role === 'platform_admin') {
    // Check if user already exists in DB to avoid double creation
    const existing = await User.findOne({ clerkId: userId }).lean() as any
    if (!existing) {
      // Find default innosl tenant for the admin
      const defaultTenant = await Tenant.findOne({ slug: 'innosl' }).lean() as any
      if (defaultTenant) {
        await User.create({
          clerkId: userId,
          email: userEmail,
          name: userName,
          role: 'platform_admin',
          tenantId: defaultTenant._id,
        })
      }
    }

    // Update Clerk metadata
    try {
      const clerk = await clerkClient()
      await clerk.users.updateUserMetadata(userId, {
        publicMetadata: { role: 'platform_admin' },
      })
    } catch { /* non-fatal */ }

    redirect('/admin/dashboard')
  }

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