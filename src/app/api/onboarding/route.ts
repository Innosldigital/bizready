export const dynamic = 'force-dynamic'

import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { User, Tenant } from '@/models'

export async function POST() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Get user from Clerk directly (faster than currentUser() on first signup)
    const clerk = await clerkClient()
    let clerkUser: any

    try {
      // Use the correct Clerk SDK method
      clerkUser = await clerk.users.getUser(userId)
    } catch (clerkErr: any) {
      console.error('Clerk getUser error:', clerkErr)
      return new NextResponse(`Clerk error: ${clerkErr.message}`, { status: 401 })
    }

    if (!clerkUser || !clerkUser.emailAddresses?.[0]) {
      return new NextResponse('User not found in Clerk', { status: 401 })
    }

    await connectDB()

    // Check if user already exists in MongoDB
    const existingUser = await User.findOne({ clerkId: userId })
    if (existingUser) {
      try {
        await clerk.users.updateUserMetadata(userId, {
          publicMetadata: { role: existingUser.role },
        })
      } catch (metadataErr) {
        console.warn('Clerk metadata sync skipped for existing user:', metadataErr)
      }

      return NextResponse.json({ success: true, user: existingUser })
    }

    // Find a default tenant for trial users (BizReady Platform)
    const defaultTenant = await Tenant.findOne({ slug: 'innosl' })
    if (!defaultTenant) {
      return new NextResponse('Default tenant not found. Run: npm run seed', { status: 500 })
    }

    // Determine role — platform_admin if email is in PLATFORM_ADMIN_EMAILS, otherwise bank_admin
    const platformAdminEmails = (process.env.PLATFORM_ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)
    const userEmail = clerkUser.emailAddresses[0].emailAddress
    const userRole = platformAdminEmails.includes(userEmail) ? 'platform_admin' : 'bank_admin'
    const firstName = clerkUser.firstName || 'User'
    const lastName = clerkUser.lastName || ''

    // Create new user in MongoDB with determined role
    const newUser = await User.create({
      clerkId: userId,
      email: userEmail,
      name: `${firstName} ${lastName}`.trim(),
      role: userRole,
      tenantId: defaultTenant._id,
    })

    // Sync role to Clerk public metadata so middleware session claims are populated
    await clerk.users.updateUserMetadata(userId, {
      publicMetadata: { role: newUser.role },
    })

    return NextResponse.json({ success: true, user: newUser })
  } catch (err: any) {
    console.error('Onboarding error:', err)
    return new NextResponse(`Server error: ${err.message}`, { status: 500 })
  }
}
