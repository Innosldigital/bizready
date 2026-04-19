// src/app/api/bank/onboarding/route.ts
// Mark an onboarding step as complete for the tenant

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { connectDB } from '@/lib/db'
import { User, Tenant } from '@/models'
import { z } from 'zod'
import { ONBOARDING_STEPS } from '@/lib/onboarding/steps'

const Schema = z.object({
  step: z.enum(ONBOARDING_STEPS),
})

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  await connectDB()
  const user = await User.findOne({ clerkId: userId }).lean() as any
  if (!user || !['bank_admin', 'platform_admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body   = await req.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid step.' }, { status: 400 })

  await Tenant.findByIdAndUpdate(user.tenantId, {
    $addToSet: { onboardingSteps: parsed.data.step },
  })

  return NextResponse.json({ success: true })
}
