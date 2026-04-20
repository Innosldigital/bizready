// src/app/api/admin/ta/route.ts
// TA Programme management — taProvider per tenant + focal person assignment

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { connectDB } from '@/lib/db'
import { User, Tenant, Business } from '@/models'

async function getAdmin() {
  const { userId } = await auth()
  if (!userId) return null
  await connectDB()
  const user = await User.findOne({ clerkId: userId }).lean() as any
  if (!user || !['platform_admin', 'innosl_admin', 'project_manager'].includes(user.role)) return null
  return user
}

// ── GET: tenants where taProvider=innovation_sl with SME summary ──
export async function GET() {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const tenants = await Tenant.find({ taProvider: 'innovation_sl', isActive: true })
    .select('name slug plan taProvider')
    .sort({ name: 1 })
    .lean() as any[]

  const tenantIds = tenants.map(t => t._id)

  // Aggregate SME counts per tenant
  const smeSummary = await Business.aggregate([
    { $match: { tenantId: { $in: tenantIds } } },
    {
      $group: {
        _id:         '$tenantId',
        total:       { $sum: 1 },
        unassigned:  { $sum: { $cond: [{ $eq: ['$focalPersonId', null] }, 1, 0] } },
        avgScore:    { $avg: '$latestScore' },
        investment_ready:       { $sum: { $cond: [{ $eq: ['$latestClassification', 'investment_ready'] }, 1, 0] } },
        conditionally_lendable: { $sum: { $cond: [{ $eq: ['$latestClassification', 'conditionally_lendable'] }, 1, 0] } },
        high_risk:              { $sum: { $cond: [{ $eq: ['$latestClassification', 'high_risk'] }, 1, 0] } },
      },
    },
  ])

  const smeMap: Record<string, any> = {}
  for (const s of smeSummary) smeMap[String(s._id)] = s

  const result = tenants.map(t => ({
    ...t,
    smes: smeMap[String(t._id)] ?? { total: 0, unassigned: 0 },
  }))

  return NextResponse.json({ tenants: result })
}

// ── PATCH: set taProvider for a tenant OR assign focal person to a business ──
export async function PATCH(req: NextRequest) {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()

  // ── taProvider update ──
  if (body.action === 'set_ta_provider') {
    const { tenantId, taProvider } = body
    if (!tenantId || !['innovation_sl', 'self'].includes(taProvider)) {
      return NextResponse.json({ error: 'tenantId and valid taProvider required' }, { status: 400 })
    }
    await Tenant.findByIdAndUpdate(tenantId, { taProvider })
    return NextResponse.json({ ok: true })
  }

  // ── focal person assignment ──
  if (body.action === 'assign_focal_person') {
    const { businessId, focalPersonId } = body
    if (!businessId) return NextResponse.json({ error: 'businessId required' }, { status: 400 })

    const business = await Business.findById(businessId).lean() as any
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

    // Remove from previous focal person's assignedSMEs
    if (business.focalPersonId) {
      await User.findByIdAndUpdate(business.focalPersonId, {
        $pull: { assignedSMEs: business._id },
      })
    }

    if (focalPersonId) {
      // Validate focal person exists and has the right role
      const fp = await User.findById(focalPersonId).lean() as any
      if (!fp || !['focal_person', 'innosl_admin', 'project_manager'].includes(fp.role)) {
        return NextResponse.json({ error: 'Invalid focal person' }, { status: 400 })
      }
      await Business.findByIdAndUpdate(businessId, {
        focalPersonId,
        focalPersonName: fp.name,
      })
      await User.findByIdAndUpdate(focalPersonId, {
        $addToSet: { assignedSMEs: business._id },
      })
      return NextResponse.json({ ok: true, focalPersonName: fp.name })
    } else {
      // Unassign
      await Business.findByIdAndUpdate(businessId, {
        focalPersonId:   null,
        focalPersonName: null,
      })
      return NextResponse.json({ ok: true, focalPersonName: null })
    }
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
