import { auth, currentUser, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { User, Tenant } from '@/models'

export async function POST() {
  const { userId } = await auth()
  const user = await currentUser()

  if (!userId || !user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  await connectDB()

  // Check if user already exists in MongoDB
  const existingUser = await User.findOne({ clerkId: userId })
  if (existingUser) {
    return NextResponse.json({ success: true, user: existingUser })
  }

  // Find a default tenant for trial users (BizReady Platform)
  const defaultTenant = await Tenant.findOne({ slug: 'innosl' })
  if (!defaultTenant) {
    return new NextResponse('Default tenant not found. Please run seed script.', { status: 500 })
  }

  // Create new user in MongoDB as bank_admin for trial
  const newUser = await User.create({
    clerkId: userId,
    email: user.emailAddresses[0].emailAddress,
    name: `${user.firstName} ${user.lastName}`,
    role: 'bank_admin',
    tenantId: defaultTenant._id,
  })

  // Sync role to Clerk public metadata so middleware session claims are populated
  const clerk = await clerkClient()
  await clerk.users.updateUserMetadata(userId, {
    publicMetadata: { role: newUser.role },
  })

  return NextResponse.json({ success: true, user: newUser })
}
