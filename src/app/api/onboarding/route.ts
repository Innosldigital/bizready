export const dynamic = 'force-dynamic'

import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { handleOnboarding } from '@/lib/onboarding/onboarding-handler'
import { applyRateLimit, getRequestIp } from '@/lib/security/rate-limit'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const limited = applyRateLimit(request, {
      namespace: 'onboarding',
      key: userId,
      limit: 10,
      windowMs: 10 * 60 * 1000,
      message: 'Too many onboarding attempts. Please try again shortly.',
    })
    if (limited) return limited

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

    const email = clerkUser.emailAddresses[0].emailAddress
    const firstName = clerkUser.firstName || 'User'
    const lastName = clerkUser.lastName || ''
    const ip = getRequestIp(request)

    const result = await handleOnboarding({ userId, email, firstName, lastName, ip })

    if (result.error) {
      return new NextResponse(result.error, { status: result.status })
    }

    if (result.success === false) {
      return NextResponse.json(result, { status: result.status })
    }

    return NextResponse.json(result)
  } catch (err: any) {
    console.error('Onboarding error:', err)
    return new NextResponse(`Server error: ${err.message}`, { status: 500 })
  }
}
