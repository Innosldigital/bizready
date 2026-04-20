// src/app/admin/ta/[tenantId]/page.tsx
// TA detail for a single tenant — shows all SMEs + focal person assignment

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db'
import { User, Tenant, Business, Diagnostic } from '@/models'
import TaAssignClient from './TaAssignClient'

export default async function TaTenantPage({ params }: { params: { tenantId: string } }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  await connectDB()

  const admin = await User.findOne({ clerkId: userId }).lean() as any
  if (!admin || !['platform_admin', 'innosl_admin', 'project_manager'].includes(admin.role)) {
    redirect('/dashboard')
  }

  const tenant = await Tenant.findById(params.tenantId).lean() as any
  if (!tenant || tenant.taProvider !== 'innovation_sl') redirect('/admin/ta')

  // All SMEs for this tenant
  const businesses = await Business.find({ tenantId: tenant._id })
    .sort({ latestScore: -1 })
    .lean() as any[]

  // Last diagnostic per business
  const bizIds = businesses.map(b => b._id)
  const lastDiagnostics = await Diagnostic.aggregate([
    { $match: { businessId: { $in: bizIds } } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id:            '$businessId',
        lendabilityIndex: { $first: '$result.lendabilityIndex' },
        strategic:      { $first: '$result.strategic.percentage' },
        process:        { $first: '$result.process.percentage' },
        support:        { $first: '$result.support.percentage' },
        classification: { $first: '$result.classification' },
        createdAt:      { $first: '$createdAt' },
      },
    },
  ])

  const diagMap: Record<string, any> = {}
  for (const d of lastDiagnostics) diagMap[String(d._id)] = d

  // Available focal persons (InnoSL staff)
  const focalPersons = await User.find({
    role: { $in: ['focal_person', 'innosl_admin', 'project_manager'] },
    isActive: true,
    isPending: { $ne: true },
  })
    .select('_id name email role')
    .lean() as any[]

  const serialised = {
    tenant: JSON.parse(JSON.stringify(tenant)),
    businesses: JSON.parse(JSON.stringify(
      businesses.map(b => ({
        ...b,
        diagnostic: diagMap[String(b._id)] ?? null,
      }))
    )),
    focalPersons: JSON.parse(JSON.stringify(focalPersons)),
  }

  return <TaAssignClient {...serialised} />
}
