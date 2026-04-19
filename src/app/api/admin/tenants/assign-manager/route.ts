// src/app/api/admin/tenants/assign-manager/route.ts
// Platform admin: assign or remove a success manager for a tenant

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { connectDB } from '@/lib/db'
import { User, Tenant } from '@/models'
import { z } from 'zod'

const Schema = z.object({
  tenantId:  z.string().min(1),
  managerId: z.string().nullable(),  // clerkId of platform_admin, or null to unassign
})

export async function PUT(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  await connectDB()
  const caller = await User.findOne({ clerkId: userId }).lean() as any
  if (!caller || caller.role !== 'platform_admin') {
    return NextResponse.json({ error: 'Platform admin only.' }, { status: 403 })
  }

  const body   = await req.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })

  const { tenantId, managerId } = parsed.data

  if (managerId) {
    const manager = await User.findOne({ clerkId: managerId, role: 'platform_admin' }).lean() as any
    if (!manager) return NextResponse.json({ error: 'Manager not found or is not a platform admin.' }, { status: 404 })

    await Tenant.findByIdAndUpdate(tenantId, {
      successManagerId:    manager.clerkId,
      successManagerName:  manager.name,
      successManagerEmail: manager.email,
    })
    return NextResponse.json({ success: true, data: { name: manager.name, email: manager.email } })
  }

  // Unassign
  await Tenant.findByIdAndUpdate(tenantId, {
    $unset: { successManagerId: '', successManagerName: '', successManagerEmail: '' },
  })
  return NextResponse.json({ success: true, data: null })
}
