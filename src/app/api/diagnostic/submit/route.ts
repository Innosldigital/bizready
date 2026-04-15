// src/app/api/diagnostic/submit/route.ts
// Handles form submission → scoring → email → DB persistence

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Diagnostic, Business, Tenant, DiagnosticSection, Question } from '@/models'
import { calculateLendabilityIndex } from '@/lib/scoring/engine'
import { sendDiagnosticResultEmail, sendBankNotificationEmail } from '@/lib/email'
import { z } from 'zod'

// ── VALIDATION SCHEMA ─────────────────────────────────────
const SubmitSchema = z.object({
  tenantSlug: z.string().min(1),
  business: z.object({
    name:          z.string().min(1),
    ceoName:       z.string().min(1),
    email:         z.string().email(),
    phone:         z.string().optional(),
    sector:        z.string().min(1),
    yearsOperating:z.string(),
    employeeCount: z.string(),
    annualRevenue: z.string(),
    loanPurpose:   z.string(),
    location:      z.string().optional(),
  }),
  responses: z.array(z.object({
    questionId:     z.string(),
    questionText:   z.string(),
    selectedOption: z.string(),
    score:          z.number().min(0).max(20),
  })),
  period: z.string().default(() => {
    const now = new Date()
    const q   = Math.ceil((now.getMonth() + 1) / 3)
    return `Q${q}-${now.getFullYear()}`
  }),
  userId: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const body   = await req.json()
    const parsed = SubmitSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid submission data',
        details: parsed.error.flatten(),
      }, { status: 400 })
    }

    const { tenantSlug, business: bizData, responses, period, userId } = parsed.data

    // ── 1. Resolve tenant ─────────────────────────────────
    const tenant = await Tenant.findOne({ slug: tenantSlug, isActive: true })
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 })
    }

    // ── 2. Check plan submission limits ───────────────────
    if (tenant.plan === 'starter' && tenant.submissionsThisMonth >= 50) {
      return NextResponse.json({
        success: false,
        error: 'Monthly submission limit reached. Please contact your bank.',
      }, { status: 429 })
    }

    // ── 3. Upsert business profile ────────────────────────
    let business = await Business.findOne({ tenantId: tenant._id, email: bizData.email })
    if (!business) {
      business = await Business.create({
        tenantId: tenant._id,
        userId:   userId || 'anonymous',
        ...bizData,
      })
    }

    // ── 4. Load question sections for scoring ─────────────
    // DiagnosticSection has no embedded questions field — fetch manually
    const rawSections = await DiagnosticSection.find({ isActive: true })
      .sort({ order: 1 })
      .lean()
    const sections = await Promise.all(
      rawSections.map(async (section: any) => {
        const questions = await Question.find({
          sectionId: section._id,
          isActive: true,
        }).sort({ order: 1 }).lean()
        return { ...section, questions }
      })
    )

    // ── 5. Calculate lendability index ────────────────────
    const result = calculateLendabilityIndex(responses, sections as any)

    // ── 6. Save diagnostic to DB ──────────────────────────
    const diagnostic = await Diagnostic.create({
      tenantId:   tenant._id,
      businessId: business._id,
      userId:     userId || 'anonymous',
      period,
      responses,
      result,
      status:    'scored',
      scoredAt:  new Date(),
      submittedAt: new Date(),
    })

    // ── 7. Update business with latest score ──────────────
    await Business.findByIdAndUpdate(business._id, {
      $push:  { diagnostics: diagnostic._id },
      $set: {
        latestScore:          result.lendabilityIndex,
        latestClassification: result.classification,
      },
    })

    // ── 8. Update tenant submission counts ────────────────
    await Tenant.findByIdAndUpdate(tenant._id, {
      $inc: { submissionsThisMonth: 1, totalSubmissions: 1 },
    })

    // ── 9. Send emails (non-blocking) ─────────────────────
    const emailPromises = [
      sendDiagnosticResultEmail({
        business: { ...business.toObject(), ...bizData },
        result,
        theme: tenant.theme,
        period,
      }),
    ]

    if (tenant.contactEmail) {
      emailPromises.push(
        sendBankNotificationEmail({
          bankEmail: tenant.contactEmail,
          business:  { ...business.toObject(), ...bizData },
          result,
          theme: tenant.theme,
          period,
        })
      )
    }

    // Fire emails without blocking the response
    Promise.allSettled(emailPromises).then(results => {
      const sent = results.filter(r => r.status === 'fulfilled').length
      Diagnostic.findByIdAndUpdate(diagnostic._id, { emailSent: sent > 0 }).exec()
    })

    // ── 10. Return result ─────────────────────────────────
    return NextResponse.json({
      success: true,
      data: {
        diagnosticId:    diagnostic._id.toString(),
        lendabilityIndex: result.lendabilityIndex,
        classification:   result.classification,
        strategic:        result.strategic.percentage,
        operational:      result.operational.percentage,
        support:          result.support.percentage,
        bottleneck:       result.bottleneck,
        taCount:          result.taRecommendations.length,
        projectedScore:   result.projectedIndexAfterTA,
        period,
      },
    })

  } catch (error) {
    console.error('[DIAGNOSTIC SUBMIT ERROR]', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 })
  }
}

// ── GET — fetch diagnostic by ID ──────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 })

  try {
    await connectDB()
    const diagnostic = await Diagnostic.findById(id)
      .populate('businessId')
      .populate('tenantId')
      .lean()

    if (!diagnostic) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: diagnostic })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
