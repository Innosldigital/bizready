import { writeAuditLog } from '@/lib/audit'
import { connectDB } from '@/lib/db'
import { resolveOnboardingRole } from '@/lib/onboarding/policy'
import { Tenant, User } from '@/models'

export async function handleOnboarding({
  userId,
  email,
  firstName,
  lastName,
  ip,
}: {
  userId: string
  email: string
  firstName: string
  lastName: string
  ip: string
}) {
  await connectDB()

  // Check if user already exists in MongoDB
  const existingUser = await User.findOne({ clerkId: userId })
  if (existingUser) {
    await writeAuditLog({
      actorClerkId: userId,
      actorRole: existingUser.role,
      tenantId: existingUser.tenantId ? String(existingUser.tenantId) : undefined,
      action: 'onboarding.reused_existing_user',
      resourceType: 'user',
      resourceId: String(existingUser._id),
      ipAddress: ip,
      details: {
        email: existingUser.email,
      },
    })

    return { success: true, user: existingUser }
  }

  // Find a default tenant for trial users (BizReady Platform)
  const defaultTenant = await Tenant.findOne({ slug: 'innosl' })
  if (!defaultTenant) {
    return { error: 'Default tenant not found. Run: npm run seed', status: 500 }
  }

  // Determine role - platform_admin if email is in PLATFORM_ADMIN_EMAILS.
  // All other users must be provisioned intentionally instead of receiving bank access by default.
  const userRole = resolveOnboardingRole(email, process.env.PLATFORM_ADMIN_EMAILS || '')
  const normalizedEmail = email.toLowerCase()

  if (!userRole) {
    await writeAuditLog({
      actorClerkId: userId,
      action: 'onboarding.rejected_unassigned_user',
      resourceType: 'user',
      status: 'rejected',
      ipAddress: ip,
      details: {
        email: normalizedEmail,
      },
    })

    return {
      success: false,
      requiresApproval: true,
      message: 'Account is authenticated but has not been assigned a platform role yet.',
      status: 403
    }
  }

  // Create new user in MongoDB with determined role
  const newUser = await User.create({
    clerkId: userId,
    email: normalizedEmail,
    name: `${firstName} ${lastName}`.trim(),
    role: userRole,
    tenantId: defaultTenant._id,
  })

  await writeAuditLog({
    actorClerkId: userId,
    actorRole: newUser.role,
    tenantId: String(defaultTenant._id),
    action: 'onboarding.user_created',
    resourceType: 'user',
    resourceId: String(newUser._id),
    ipAddress: ip,
    details: {
      email: normalizedEmail,
      role: newUser.role,
    },
  })

  return { success: true, user: newUser }
}