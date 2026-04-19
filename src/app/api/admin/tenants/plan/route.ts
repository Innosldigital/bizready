// src/app/api/admin/tenants/plan/route.ts
// Platform admin: manually override a tenant's plan

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { connectDB } from '@/lib/db'
import { User, Tenant } from '@/models'
import { z } from 'zod'

const Schema = z.object({
  tenantId: z.string().min(1),
  plan:     z.enum(['starter', 'growth', 'enterprise', 'owner']),
  isActive: z.boolean().optional(),
})

export async function PUT(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  await connectDB()
  const me = await User.findOne({ clerkId: userId }).lean() as any
  if (!me || me.role !== 'platform_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body   = await req.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 })
  }

  const { tenantId, plan, isActive } = parsed.data

  const update: Record<string, unknown> = { plan }
  if (isActive !== undefined) update.isActive = isActive

  const tenant = await Tenant.findByIdAndUpdate(tenantId, update, { new: true }).lean() as any
  if (!tenant) return NextResponse.json({ error: 'Tenant not found.' }, { status: 404 })

  return NextResponse.json({ success: true, plan: tenant.plan, isActive: tenant.isActive })
}
