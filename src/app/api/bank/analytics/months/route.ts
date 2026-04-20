export const dynamic = 'force-dynamic'

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { connectDB } from '@/lib/db'
import { Diagnostic, User } from '@/models'

// Returns diagnostic dates for a business — both month keys (YYYY-MM) and full dates (YYYY-MM-DD)
export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const businessId = req.nextUrl.searchParams.get('businessId')
  if (!businessId) return NextResponse.json({ months: [], dates: [] })

  await connectDB()

  const user = await User.findOne({ clerkId: userId }).lean() as any
  if (!user || !['bank_admin', 'bank_staff'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let bizObjectId: mongoose.Types.ObjectId
  try {
    bizObjectId = new mongoose.Types.ObjectId(businessId)
  } catch {
    return NextResponse.json({ months: [], dates: [] })
  }

  const diagnostics = await Diagnostic.find(
    { businessId: bizObjectId },
    { createdAt: 1 }
  ).lean() as any[]

  const monthSet = new Set<string>()
  const dateSet = new Set<string>()

  for (const d of diagnostics) {
    const date = new Date(d.createdAt)
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    monthSet.add(`${y}-${m}`)
    dateSet.add(`${y}-${m}-${day}`)
  }

  return NextResponse.json({
    months: Array.from(monthSet).sort(),
    dates: Array.from(dateSet).sort(),
  })
}
