// src/app/api/bank/scoring-weights/route.ts
// Enterprise-only: update per-tenant scoring weights

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { connectDB } from '@/lib/db'
import { User, Tenant } from '@/models'
import { isPlanAtLeast } from '@/lib/plan-access'
import { z } from 'zod'

const WeightsSchema = z.object({
  strategic: z.number().min(0.01).max(0.99),
  process:   z.number().min(0.01).max(0.99),
  support:   z.number().min(0.01).max(0.99),
}).refine(
  w => Math.abs(w.strategic + w.process + w.support - 1) < 0.001,
  { message: 'Weights must sum to 1.00' }
)

export async function PUT(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  await connectDB()
  const user = await User.findOne({ clerkId: userId }).lean() as any
  if (!user || !['bank_admin', 'platform_admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const tenant = await Tenant.findById(user.tenantId).lean() as any
  if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  if (!isPlanAtLeast(tenant.plan, 'enterprise')) {
    return NextResponse.json({ error: 'Custom scoring weights require the Enterprise plan.' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = WeightsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  await Tenant.findByIdAndUpdate(user.tenantId, { scoringWeights: parsed.data })

  return NextResponse.json({ success: true, data: parsed.data })
}
