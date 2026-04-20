// src/app/api/bank/reports/pdf/route.ts
// Generates a PDF diagnostic report for a given businessId (latest scored diagnostic)

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import mongoose from 'mongoose'
import { connectDB } from '@/lib/db'
import { User, Tenant, Business, Diagnostic } from '@/models'
import { renderToBuffer, Document } from '@react-pdf/renderer'
import { createElement, type ReactElement } from 'react'
import type { DocumentProps } from '@react-pdf/renderer'
import { DiagnosticPDFReport } from '@/lib/pdf/report'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const businessId = req.nextUrl.searchParams.get('businessId')
  if (!businessId) return NextResponse.json({ error: 'businessId required' }, { status: 400 })

  await connectDB()
  const user = await User.findOne({ clerkId: userId }).lean() as any
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const role = user.role
  if (!['platform_admin', 'bank_admin', 'bank_staff'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const tenant = await Tenant.findById(user.tenantId).lean() as any
  if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const business = await Business.findById(businessId).lean() as any
  if (!business || business.tenantId.toString() !== user.tenantId.toString()) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 })
  }

  const diagnostic = await Diagnostic.findOne({
    tenantId: user.tenantId,
    businessId: new mongoose.Types.ObjectId(businessId),
  }).sort({ createdAt: -1 }).lean() as any

  if (!diagnostic) {
    return NextResponse.json({ error: 'No scored diagnostic found for this business' }, { status: 404 })
  }

  const element = createElement(DiagnosticPDFReport, { business, diagnostic, tenant }) as ReactElement<DocumentProps>
  const pdfBuffer = await renderToBuffer(element)
  const pdfBytes  = new Uint8Array(pdfBuffer)

  const safeName = business.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()
  return new NextResponse(pdfBytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="bizready-report-${safeName}.pdf"`,
    },
  })
}
