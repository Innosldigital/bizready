import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db'
import { User, Tenant, Business } from '@/models'

export default async function OnboardingPage() {
  const { userId } = await auth()

  if (!userId) redirect('/sign-in')

  await connectDB()

  // ── Already exists in DB - check setup status then redirect ──
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
    // Also re-activate the account in case isActive was false (which would cause a redirect loop)
    if (intendedRole !== existingUser.role || !existingUser.isActive) {
      await User.updateOne({ clerkId: userId }, { role: intendedRole, isActive: true })
      existingUser.role = intendedRole
      existingUser.isActive = true
    }

    try {
      const clerk = await clerkClient()
      await clerk.users.updateUserMetadata(userId, {
        publicMetadata: { role: existingUser.role },
      })
    } catch { /* non-fatal */ }

    if (['platform_admin','innosl_admin','focal_person','project_manager'].includes(existingUser.role)) redirect('/admin/dashboard')
    if (existingUser.role === 'external_viewer') redirect('/ext/smes')
    if (existingUser.role === 'sme')            redirect('/sme/progress')

    // bank_admin: check if they still need to complete bank setup
    // (their tenantId still points to the default 'innosl' tenant)
    if (existingUser.role === 'bank_admin') {
      const tenant = await Tenant.findById(existingUser.tenantId).lean() as any
      if (!tenant || tenant.slug === 'innosl') redirect('/onboarding/bank-setup')
    }

    redirect('/bank/dashboard')
  }

  // ── New user - fetch from Clerk to get email ──
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

  const role = adminEmails.includes(userEmail) ? 'platform_admin' : null

  // ── SME Check - if user has an email from a diagnostic submission ──
  const isSME = await Business.findOne({ email: userEmail }).lean()

  // ── Pre-provisioned InnoSL staff check ──
  // Admin may have created a pending record for this email before signup
  const pendingStaff = !isSME && !role
    ? await User.findOne({ email: userEmail, isPending: true }).lean() as any
    : null

  const finalRole = isSME ? 'sme' : (pendingStaff?.role ?? role)

  // ── Activate pre-provisioned staff account ──
  if (pendingStaff && finalRole) {
    await User.updateOne(
      { _id: pendingStaff._id },
      { clerkId: userId, name: userName, isPending: false, isActive: true }
    )
    try {
      const clerk = await clerkClient()
      await clerk.users.updateUserMetadata(userId, { publicMetadata: { role: finalRole } })
    } catch { /* non-fatal */ }
    if (finalRole === 'external_viewer') redirect('/ext/smes')
    redirect('/admin/dashboard')
  }

  // Super Admin Check - Skip onboarding and redirect to admin dashboard ──
  if (finalRole === 'platform_admin') {
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
          role: finalRole,
          tenantId: defaultTenant._id,
        })
      }
    }

    // Update Clerk metadata
    try {
      const clerk = await clerkClient()
      await clerk.users.updateUserMetadata(userId, {
        publicMetadata: { role: finalRole },
      })
    } catch { /* non-fatal */ }

    if (finalRole === 'platform_admin') redirect('/admin/dashboard')
    if (finalRole === 'sme')            redirect('/sme/progress')
  }

  if (!finalRole) redirect('/onboarding/access-request')

  // ── Find default innosl tenant (temporary placeholder for seeded system roles) ──
  const defaultTenant = await Tenant.findOne({ slug: 'innosl' }).lean() as any
  if (!defaultTenant) redirect('/onboarding/setup-required')

  // ── Create user in MongoDB ──
  const smeBusinessDoc = isSME as any
  try {
    await User.create({
      clerkId:    userId,
      email:      userEmail,
      name:       userName,
      role:       finalRole,
      tenantId:   finalRole === 'sme' ? smeBusinessDoc.tenantId : defaultTenant._id,
      ...(finalRole === 'sme' ? { businessId: smeBusinessDoc._id } : {}),
    })

    // Link the anonymous Business record to the real Clerk user so future
    // diagnostic-page restriction checks (which query by userId) work correctly
    if (finalRole === 'sme' && smeBusinessDoc) {
      await Business.findByIdAndUpdate(smeBusinessDoc._id, { userId })
    }
  } catch (e: any) {
    // Duplicate key - parallel request beat us; fetch the existing record and redirect
    if (e.code === 11000) {
      const existing = await User.findOne({ clerkId: userId }).lean() as any
      if (existing?.role === 'platform_admin' || existing?.role === 'innosl_admin' ||
          existing?.role === 'focal_person' || existing?.role === 'project_manager') redirect('/admin/dashboard')
      if (existing?.role === 'external_viewer') redirect('/ext/smes')
      if (existing?.role === 'sme')             redirect('/sme/progress')
      redirect('/onboarding/bank-setup')
    }
    throw e
  }

  // ── Write role to Clerk metadata ──
  try {
    const clerk = await clerkClient()
    await clerk.users.updateUserMetadata(userId, {
      publicMetadata: { role: finalRole },
    })
  } catch { /* non-fatal */ }

  // ── Redirect: admins go straight to dashboard, bank admins complete setup ──
  if (finalRole === 'sme') redirect('/sme/progress')
  redirect('/onboarding/bank-setup')
}
