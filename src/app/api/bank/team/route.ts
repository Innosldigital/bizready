// src/app/api/bank/team/route.ts
// POST — invite a new team member; GET — list current team members

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { connectDB } from '@/lib/db'
import { User, Tenant } from '@/models'
import { z } from 'zod'

const InviteSchema = z.object({
  email: z.string().email(),
  role:  z.enum(['bank_staff', 'bank_admin']),
})

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  await connectDB()
  const me = await User.findOne({ clerkId: userId }).lean() as any
  if (!me || !['bank_admin', 'platform_admin'].includes(me.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const members = await User.find({ tenantId: me.tenantId })
    .select('name email role clerkId createdAt')
    .sort({ createdAt: 1 })
    .lean() as any[]

  return NextResponse.json({ members })
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  await connectDB()
  const me = await User.findOne({ clerkId: userId }).lean() as any
  if (!me || me.role !== 'bank_admin') {
    return NextResponse.json({ error: 'Only bank admins can invite team members.' }, { status: 403 })
  }

  const body   = await req.json()
  const parsed = InviteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid email or role.' }, { status: 400 })
  }

  const { email, role } = parsed.data

  // Check if already a member
  const existing = await User.findOne({ email, tenantId: me.tenantId }).lean()
  if (existing) {
    return NextResponse.json({ error: 'This person is already a team member.' }, { status: 409 })
  }

  const tenant = await Tenant.findById(me.tenantId).lean() as any
  if (!tenant) return NextResponse.json({ error: 'Tenant not found.' }, { status: 404 })

  // Send Clerk invitation with metadata so onboarding auto-assigns role + tenantId
  try {
    const clerk = await clerkClient()
    await clerk.invitations.createInvitation({
      emailAddress: email,
      redirectUrl:  `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://bizready.io'}/sign-up`,
      publicMetadata: {
        invitedRole:     role,
        invitedTenantId: String(me.tenantId),
        invitedBy:       me.name ?? me.email,
        bankName:        tenant.theme?.bankName ?? tenant.name,
      },
      notify: true,
    })
  } catch (err: any) {
    // Clerk throws if already invited
    const msg = err?.errors?.[0]?.message ?? err?.message ?? 'Failed to send invitation.'
    return NextResponse.json({ error: msg }, { status: 422 })
  }

  return NextResponse.json({ success: true, email, role })
}
