// src/app/api/keys/route.ts
// Enterprise: create, list, and revoke API keys for programmatic access

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createHash, randomBytes } from 'crypto'
import { connectDB } from '@/lib/db'
import { User, Tenant, ApiKey } from '@/models'
import { isPlanAtLeast } from '@/lib/plan-access'
import { z } from 'zod'

function hashKey(key: string) {
  return createHash('sha256').update(key).digest('hex')
}

async function resolveUser(userId: string) {
  await connectDB()
  const user   = await User.findOne({ clerkId: userId }).lean() as any
  if (!user || !['bank_admin', 'platform_admin'].includes(user.role)) return null
  const tenant = await Tenant.findById(user.tenantId).lean() as any
  if (!tenant || !isPlanAtLeast(tenant.plan, 'enterprise')) return null
  return { user, tenant }
}

// ── GET: list keys for tenant ─────────────────────────────
export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const ctx = await resolveUser(userId)
  if (!ctx) return NextResponse.json({ error: 'Enterprise plan required.' }, { status: 403 })

  const keys = await ApiKey.find({ tenantId: ctx.user.tenantId, isActive: true })
    .select('-keyHash')
    .sort({ createdAt: -1 })
    .lean()

  return NextResponse.json({ success: true, data: keys })
}

// ── POST: create a new key ────────────────────────────────
const CreateSchema = z.object({ name: z.string().min(1).max(80) })

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const ctx = await resolveUser(userId)
  if (!ctx) return NextResponse.json({ error: 'Enterprise plan required.' }, { status: 403 })

  const body   = await req.json()
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Name is required.' }, { status: 400 })

  const existing = await ApiKey.countDocuments({ tenantId: ctx.user.tenantId, isActive: true })
  if (existing >= 10) {
    return NextResponse.json({ error: 'Maximum 10 active API keys allowed.' }, { status: 400 })
  }

  const rawKey   = `bzr_${randomBytes(32).toString('hex')}`
  const keyHash  = hashKey(rawKey)
  const keyPrefix = rawKey.slice(0, 12)

  await ApiKey.create({
    tenantId:  ctx.user.tenantId,
    name:      parsed.data.name,
    keyPrefix,
    keyHash,
    createdBy: userId,
  })

  // Return the full key ONCE — never stored in plaintext
  return NextResponse.json({ success: true, data: { key: rawKey, keyPrefix, name: parsed.data.name } }, { status: 201 })
}

// ── DELETE: revoke a key ──────────────────────────────────
export async function DELETE(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const ctx = await resolveUser(userId)
  if (!ctx) return NextResponse.json({ error: 'Enterprise plan required.' }, { status: 403 })

  const keyId = req.nextUrl.searchParams.get('id')
  if (!keyId) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const result = await ApiKey.findOneAndUpdate(
    { _id: keyId, tenantId: ctx.user.tenantId },
    { isActive: false }
  )

  if (!result) return NextResponse.json({ error: 'Key not found' }, { status: 404 })

  return NextResponse.json({ success: true })
}
