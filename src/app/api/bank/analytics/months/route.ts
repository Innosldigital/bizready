export const dynamic = 'force-dynamic'

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { connectDB } from '@/lib/db'
import { Diagnostic, User } from '@/models'

// Returns list of YYYY-MM strings that have at least one diagnostic for a business
export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const businessId = req.nextUrl.searchParams.get('businessId')
  if (!businessId) return NextResponse.json({ months: [] })

  await connectDB()

  const user = await User.findOne({ clerkId: userId }).lean() as any
  if (!user || !['bank_admin', 'bank_staff'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const results = await Diagnostic.aggregate([
    { $match: { businessId: new mongoose.Types.ObjectId(businessId) } },
    {
      $group: {
        _id: {
          year:  { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ])

  const months = results.map(r => {
    const y = r._id.year
    const m = String(r._id.month).padStart(2, '0')
    return `${y}-${m}`
  })

  return NextResponse.json({ months })
}
