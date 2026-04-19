// src/app/admin/staff/page.tsx

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db'
import { User, Business } from '@/models'
import { INNOSL_ROLES } from '@/lib/roles'
import StaffClient from './StaffClient'

export default async function StaffPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  await connectDB()

  const user = await User.findOne({ clerkId: userId }).lean() as any
  if (!user || user.role !== 'platform_admin') redirect('/admin/dashboard')

  const [staffRaw, businessesRaw] = await Promise.all([
    User.find({ role: { $in: INNOSL_ROLES } })
      .populate('assignedSMEs', 'name sector latestScore latestClassification')
      .sort({ createdAt: -1 })
      .lean(),
    Business.find({})
      .select('name sector latestScore latestClassification')
      .sort({ name: 1 })
      .lean(),
  ])

  const staff = staffRaw.map((s: any) => ({
    _id:         String(s._id),
    name:        s.name,
    email:       s.email,
    role:        s.role,
    jobTitle:    s.jobTitle ?? '',
    isActive:    s.isActive ?? true,
    isPending:   s.isPending ?? false,
    assignedSMEs: (s.assignedSMEs ?? []).map((b: any) => ({
      _id:                 String(b._id),
      name:                b.name,
      sector:              b.sector,
      latestScore:         b.latestScore,
      latestClassification: b.latestClassification,
    })),
    createdAt: s.createdAt?.toISOString() ?? '',
  }))

  const businesses = businessesRaw.map((b: any) => ({
    _id:                 String(b._id),
    name:                b.name,
    sector:              b.sector,
    latestScore:         b.latestScore,
    latestClassification: b.latestClassification,
  }))

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <StaffClient initialStaff={staff} businesses={businesses} />
    </div>
  )
}
