// src/app/api/bank/questions/route.ts
// Bank admin: manage tenant-specific questions

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { connectDB } from '@/lib/db'
import { User, Question, DiagnosticSection } from '@/models'
import { z } from 'zod'

const OptionSchema = z.object({
  text:  z.string().min(1),
  score: z.number().min(0).max(10),
})

const CreateSchema = z.object({
  sectionId:   z.string().min(1),
  areaId:      z.string().min(1),
  parameterId: z.string().min(1),
  text:        z.string().min(1),
  hint:        z.string().optional(),
  type:        z.enum(['mcq', 'scale', 'yesno', 'text']),
  options:     z.array(OptionSchema).min(1),
  order:       z.number().int().min(1),
  isRequired:  z.boolean().default(true),
  isActive:    z.boolean().default(true),
})

const UpdateSchema = CreateSchema.partial().extend({
  id: z.string().min(1),
})

async function requireBankAdmin(userId: string | null) {
  if (!userId) return null
  await connectDB()
  const me = await User.findOne({ clerkId: userId }).lean() as any
  if (!me || !['bank_admin', 'platform_admin'].includes(me.role)) return null
  return me
}

// GET /api/bank/questions — returns platform questions + this tenant's questions
export async function GET(req: NextRequest) {
  const { userId } = await auth()
  const me = await requireBankAdmin(userId)
  if (!me) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const tenantId = String(me.tenantId)

  const [platformSections, tenantSections, platformQuestions, tenantQuestions] = await Promise.all([
    DiagnosticSection.find({ source: 'platform', tenantId: null }).sort({ order: 1 }).lean(),
    DiagnosticSection.find({ source: 'tenant', tenantId }).sort({ order: 1 }).lean(),
    Question.find({ source: 'platform', tenantId: null }).sort({ order: 1 }).lean(),
    Question.find({ source: 'tenant', tenantId }).sort({ order: 1 }).lean(),
  ])

  return NextResponse.json({
    platformSections,
    tenantSections,
    platformQuestions,
    tenantQuestions,
  })
}

// POST /api/bank/questions — create a tenant-specific question
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  const me = await requireBankAdmin(userId)
  if (!me) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body   = await req.json()
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid payload' }, { status: 400 })
  }

  const question = await Question.create({
    ...parsed.data,
    source:   'tenant',
    tenantId: me.tenantId,
  })
  return NextResponse.json({ question }, { status: 201 })
}

// PUT /api/bank/questions — update a tenant-specific question
export async function PUT(req: NextRequest) {
  const { userId } = await auth()
  const me = await requireBankAdmin(userId)
  if (!me) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body   = await req.json()
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid payload' }, { status: 400 })
  }

  const { id, ...updates } = parsed.data
  const question = await Question.findOneAndUpdate(
    { _id: id, source: 'tenant', tenantId: me.tenantId },
    updates,
    { new: true },
  ).lean()

  if (!question) return NextResponse.json({ error: 'Question not found' }, { status: 404 })
  return NextResponse.json({ question })
}

// DELETE /api/bank/questions?id=
export async function DELETE(req: NextRequest) {
  const { userId } = await auth()
  const me = await requireBankAdmin(userId)
  if (!me) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  await Question.findOneAndDelete({ _id: id, source: 'tenant', tenantId: me.tenantId })
  return NextResponse.json({ success: true })
}
