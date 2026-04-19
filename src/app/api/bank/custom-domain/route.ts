// src/app/api/bank/custom-domain/route.ts
// Growth+: set or clear the tenant's custom domain

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { connectDB } from '@/lib/db'
import { User, Tenant } from '@/models'
import { isPlanAtLeast } from '@/lib/plan-access'
import { z } from 'zod'

const Schema = z.object({
  customDomain: z.string().max(253).optional().nullable(),
})

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

  if (!isPlanAtLeast(tenant.plan, 'growth')) {
    return NextResponse.json({ error: 'Custom domains require the Growth plan or above.' }, { status: 403 })
  }

  const body   = await req.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid domain.' }, { status: 400 })

  const domain = parsed.data.customDomain?.trim().toLowerCase().replace(/^https?:\/\//, '') || null

  // Ensure uniqueness — no two tenants can claim the same domain
  if (domain) {
    const conflict = await Tenant.findOne({ customDomain: domain, _id: { $ne: user.tenantId } }).lean()
    if (conflict) return NextResponse.json({ error: 'This domain is already registered to another organisation.' }, { status: 409 })
  }

  await Tenant.findByIdAndUpdate(user.tenantId, { customDomain: domain ?? null })

  return NextResponse.json({ success: true, data: { customDomain: domain } })
}
