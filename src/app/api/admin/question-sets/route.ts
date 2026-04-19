// src/app/api/admin/question-sets/route.ts
// Platform admin: manage question sets and assign to tenants

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { connectDB } from '@/lib/db'
import { User, QuestionSet, Tenant } from '@/models'
import { z } from 'zod'

const CreateSchema = z.object({
  name:        z.string().min(1),
  description: z.string().optional(),
  tenantIds:   z.array(z.string()).default([]),
  isActive:    z.boolean().default(true),
})

const UpdateSchema = CreateSchema.partial().extend({
  id: z.string().min(1),
})

async function requirePlatformAdmin(userId: string | null) {
  if (!userId) return null
  await connectDB()
  const me = await User.findOne({ clerkId: userId }).lean() as any
  if (!me || me.role !== 'platform_admin') return null
  return me
}

// GET /api/admin/question-sets
export async function GET(req: NextRequest) {
  const { userId } = await auth()
  const me = await requirePlatformAdmin(userId)
  if (!me) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const sets    = await QuestionSet.find().sort({ createdAt: -1 }).lean()
  const tenants = await Tenant.find().select('name slug').sort({ name: 1 }).lean()

  return NextResponse.json({ sets, tenants })
}

// POST /api/admin/question-sets
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  const me = await requirePlatformAdmin(userId)
  if (!me) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body   = await req.json()
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid payload' }, { status: 400 })
  }

  const set = await QuestionSet.create({ ...parsed.data, createdBy: me.clerkId })
  return NextResponse.json({ set }, { status: 201 })
}

// PUT /api/admin/question-sets
export async function PUT(req: NextRequest) {
  const { userId } = await auth()
  const me = await requirePlatformAdmin(userId)
  if (!me) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body   = await req.json()
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid payload' }, { status: 400 })
  }

  const { id, ...updates } = parsed.data
  const set = await QuestionSet.findByIdAndUpdate(id, updates, { new: true }).lean()
  if (!set) return NextResponse.json({ error: 'Question set not found' }, { status: 404 })

  return NextResponse.json({ set })
}

// DELETE /api/admin/question-sets?id=
export async function DELETE(req: NextRequest) {
  const { userId } = await auth()
  const me = await requirePlatformAdmin(userId)
  if (!me) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  await QuestionSet.findByIdAndDelete(id)
  return NextResponse.json({ success: true })
}
