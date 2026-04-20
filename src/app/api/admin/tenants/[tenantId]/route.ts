// src/app/api/admin/tenants/[tenantId]/route.ts
// Platform admin: hard-delete a tenant and all associated data

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { connectDB } from '@/lib/db'
import { User, Tenant, Business, Diagnostic, TAProgramme, ApiKey, AuditLog } from '@/models'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  await connectDB()

  const caller = await User.findOne({ clerkId: userId }).lean() as any
  if (!caller || caller.role !== 'platform_admin') {
    return NextResponse.json({ error: 'Platform admin only.' }, { status: 403 })
  }

  const { tenantId } = params

  const tenant = await Tenant.findById(tenantId).lean() as any
  if (!tenant) return NextResponse.json({ error: 'Tenant not found.' }, { status: 404 })

  // Prevent deleting the owner/platform tenant
  if (tenant.plan === 'owner') {
    return NextResponse.json({ error: 'Cannot delete the platform owner tenant.' }, { status: 400 })
  }

  // 1. Find all users belonging to this tenant (bank_admin, bank_staff, sme)
  const tenantUsers = await User.find({ tenantId }).select('clerkId').lean() as any[]
  const clerkIds = tenantUsers.map((u: any) => u.clerkId)

  // 2. Delete from Clerk (best-effort — don't fail if Clerk delete errors)
  const clerk = await clerkClient()
  await Promise.allSettled(
    clerkIds.map((cid: string) => clerk.users.deleteUser(cid))
  )

  // 3. Cascade-delete all tenant data from MongoDB
  await Promise.all([
    Diagnostic.deleteMany({ tenantId }),
    Business.deleteMany({ tenantId }),
    TAProgramme.deleteMany({ tenantId }),
    ApiKey.deleteMany({ tenantId }),
    AuditLog.deleteMany({ tenantId }),
    User.deleteMany({ tenantId }),
  ])

  // 4. Delete the tenant itself
  await Tenant.findByIdAndDelete(tenantId)

  return NextResponse.json({
    success: true,
    deleted: {
      tenant: tenant.name,
      users: clerkIds.length,
    },
  })
}
