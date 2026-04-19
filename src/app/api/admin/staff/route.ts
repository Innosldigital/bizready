// src/app/api/admin/staff/route.ts
// InnoSL staff management — CRUD for platform staff accounts

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { connectDB } from '@/lib/db'
import { User, Tenant } from '@/models'
import { INNOSL_ROLES, ASSIGNABLE_INNOSL_ROLES, isInnoSLRole } from '@/lib/roles'

async function getAdmin() {
  const { userId } = await auth()
  if (!userId) return null
  await connectDB()
  const user = await User.findOne({ clerkId: userId }).lean() as any
  if (!user || user.role !== 'platform_admin') return null
  return user
}

// ── GET: list all InnoSL staff ────────────────────────────
export async function GET() {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const staff = await User.find({ role: { $in: INNOSL_ROLES } })
    .populate('assignedSMEs', 'name sector latestScore latestClassification')
    .sort({ createdAt: -1 })
    .lean()

  return NextResponse.json({ staff })
}

// ── POST: provision a new staff member (pending until they sign up) ───
export async function POST(req: NextRequest) {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { name, email, role, jobTitle, assignedSMEs } = body

  if (!name || !email || !role) {
    return NextResponse.json({ error: 'name, email and role are required' }, { status: 400 })
  }
  if (!ASSIGNABLE_INNOSL_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  const normalEmail = email.toLowerCase().trim()

  // Check for duplicate email
  const existing = await User.findOne({ email: normalEmail }).lean()
  if (existing) {
    return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 })
  }

  // Find the InnoSL tenant
  const innoTenant = await Tenant.findOne({ slug: 'innosl' }).lean() as any

  const staff = await User.create({
    clerkId:     `PENDING_${normalEmail}`,
    email:       normalEmail,
    name:        name.trim(),
    role,
    jobTitle:    jobTitle?.trim() || undefined,
    tenantId:    innoTenant?._id,
    assignedSMEs: assignedSMEs ?? [],
    isPending:   true,
    isActive:    true,
  })

  return NextResponse.json({ staff }, { status: 201 })
}

// ── PUT: update role, jobTitle, assignedSMEs, isActive ───
export async function PUT(req: NextRequest) {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { id, role, jobTitle, assignedSMEs, isActive } = body

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  if (role && !isInnoSLRole(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  const target = await User.findById(id).lean() as any
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!isInnoSLRole(target.role)) {
    return NextResponse.json({ error: 'Cannot modify non-InnoSL staff via this endpoint' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  if (role !== undefined)         updates.role = role
  if (jobTitle !== undefined)     updates.jobTitle = jobTitle
  if (assignedSMEs !== undefined) updates.assignedSMEs = assignedSMEs
  if (isActive !== undefined)     updates.isActive = isActive

  const updated = await User.findByIdAndUpdate(id, updates, { new: true })
    .populate('assignedSMEs', 'name sector latestScore latestClassification')
    .lean()

  return NextResponse.json({ staff: updated })
}

// ── DELETE: remove pending staff, or deactivate active staff ──
export async function DELETE(req: NextRequest) {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const target = await User.findById(id).lean() as any
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!isInnoSLRole(target.role)) {
    return NextResponse.json({ error: 'Cannot delete non-InnoSL staff' }, { status: 400 })
  }

  if (target.isPending) {
    await User.findByIdAndDelete(id)
    return NextResponse.json({ deleted: true })
  }

  // Active user — deactivate only (preserve audit trail)
  await User.findByIdAndUpdate(id, { isActive: false })
  return NextResponse.json({ deactivated: true })
}
