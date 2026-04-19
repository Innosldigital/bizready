// src/app/api/diagnostic/submit/route.ts
// Diagnostic Submission API - processes answers and triggers scoring engine

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { connectDB } from '@/lib/db'
import { Diagnostic, Business, Tenant, DiagnosticSection, Question, User, TAProgramme } from '@/models'
import { PLANS, PlanTier } from '@/types'
import { calculateLendabilityIndex } from '@/lib/scoring/engine'
import { sendDiagnosticResultEmail, sendBankNotificationEmail } from '@/lib/email'
import { applyRateLimit, getRequestIp } from '@/lib/security/rate-limit'
import { z } from 'zod'

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000

const SubmitSchema = z.object({
  tenantSlug: z.string().min(1),
  business: z.object({
    name:                z.string().min(1),
    ceoName:             z.string().min(1),
    email:               z.string().email(),
    phone:               z.string().optional(),
    sector:              z.string().min(1),
    yearsOperating:      z.string().optional(),
    employeeCount:       z.string().optional(),
    femaleEmployeeCount: z.string().optional(),
    annualRevenue:       z.string().optional(),
    loanPurpose:         z.string().optional(),
    location:            z.string().optional(),
    district:            z.string().optional(),
    problemSolving:      z.string().optional(),
    proposedSolution:    z.string().optional(),
    foundingDate:        z.string().optional(),
    registrationStatus:  z.string().optional(),
  }),
  responses: z.array(z.object({
    questionId:     z.string(),
    questionText:   z.string(),
    selectedOption: z.string(),
    score:          z.number().min(0).max(10),
    areaId:         z.string().optional(),
    parameterId:    z.string().optional(),
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
    const body   = await req.json()
    const parsed = SubmitSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({
        success: false, error: 'Invalid submission data',
        details: parsed.error.flatten(),
      }, { status: 400 })
    }

    const { tenantSlug, business: bizData, responses, period, userId } = parsed.data

    const limited = applyRateLimit(req, {
      namespace: 'diagnostic-submit',
      key: `${tenantSlug}:${getRequestIp(req)}`,
      limit: 8,
      windowMs: 15 * 60 * 1000,
      message: 'Too many diagnostic submissions from this source. Please wait before trying again.',
    })
    if (limited) return limited

    await connectDB()

    // ── 1. Resolve tenant ─────────────────────────────────
    const tenant = await Tenant.findOne({ slug: tenantSlug, isActive: true })
    if (!tenant) return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 })

    // ── 2. Check plan submission limits ───────────────────
    const planConfig = PLANS[tenant.plan as PlanTier] ?? PLANS.starter
    if (typeof planConfig.submissionsPerMonth === 'number' && tenant.submissionsThisMonth >= planConfig.submissionsPerMonth) {
      return NextResponse.json({
        success: false, error: 'Monthly submission limit reached. Please contact your bank.',
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
    } else {
      // Update profile fields (but not diagnostics list)
      Object.assign(business, bizData)
      await business.save()
    }

    // ── 4. 90-day restriction: check for recent submission ─
    const lastDiag = await Diagnostic.findOne(
      { tenantId: tenant._id, businessId: business._id, status: { $in: ['submitted','scored','reported'] } },
      { submittedAt: 1, nextDiagnosticAvailable: 1, _id: 1 },
    ).sort({ submittedAt: -1 }).lean() as any

    const now           = new Date()
    const isRestricted  = lastDiag && (
      lastDiag.nextDiagnosticAvailable
        ? lastDiag.nextDiagnosticAvailable > now
        : (lastDiag.submittedAt && now.getTime() - lastDiag.submittedAt.getTime() < NINETY_DAYS_MS)
    )

    if (isRestricted) {
      const unlockDate = lastDiag.nextDiagnosticAvailable
        ?? new Date(lastDiag.submittedAt.getTime() + NINETY_DAYS_MS)
      return NextResponse.json({
        success: false,
        error: 'Diagnostic not available yet',
        restrictedUntil: unlockDate.toISOString(),
      }, { status: 429 })
    }

    // ── 5. Load question sections for scoring ─────────────
    const rawSections = await DiagnosticSection.find({ isActive: true }).sort({ order: 1 }).lean()
    const sections = await Promise.all(
      rawSections.map(async (section: any) => {
        const questions = await Question.find({
          sectionId: section._id,
          isActive: true,
          $or: [
            { source: 'platform', tenantId: null },
            { source: 'tenant', tenantId: tenant._id },
          ],
        }).sort({ order: 1 }).lean()
        return { ...section, questions }
      })
    )

    // ── 6. Calculate lendability index ────────────────────
    const result = calculateLendabilityIndex(responses, sections as any, tenant.scoringWeights)

    const nextAvailable = new Date(now.getTime() + NINETY_DAYS_MS)

    // ── 7. Save diagnostic to DB ──────────────────────────
    const diagnostic = await Diagnostic.create({
      tenantId:                tenant._id,
      businessId:              business._id,
      userId:                  userId || 'anonymous',
      period,
      responses,
      result,
      status:                  'scored',
      scoredAt:                now,
      submittedAt:             now,
      nextDiagnosticAvailable: nextAvailable,
    })

    // ── 8. Update business with latest score ──────────────
    await Business.findByIdAndUpdate(business._id, {
      $addToSet: { diagnostics: diagnostic._id },
      $set: {
        latestScore:          result.lendabilityIndex,
        latestClassification: result.classification,
      },
    })

    // ── 9. Auto-populate TA Programme from recommendations ─
    const criticalAndHigh = (result.taRecommendations ?? []).filter(
      r => r.priority === 'critical' || r.priority === 'high'
    )
    if (criticalAndHigh.length > 0) {
      await Promise.all(criticalAndHigh.map(rec =>
        TAProgramme.findOneAndUpdate(
          { tenantId: tenant._id, businessId: business._id, area: rec.area, parameterId: rec.parameterId ?? '' },
          {
            $setOnInsert: {
              tenantId:      tenant._id,
              businessId:    business._id,
              diagnosticId:  diagnostic._id,
              area:          rec.area,
              parameterId:   rec.parameterId,
              capacityLevel: rec.capacityLevel,
              recommendation: rec.recommendation,
              tools:         rec.tools ?? [],
              timeframeWeeks: rec.timeframeWeeks,
              status:        'upcoming',
              autoGenerated: true,
              progressPercent: 0,
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        )
      ))

      await Business.findByIdAndUpdate(business._id, { $set: { taStatus: 'active' } })
    }

    // ── 10. Update tenant submission counts ───────────────
    await Tenant.findByIdAndUpdate(tenant._id, {
      $inc: { submissionsThisMonth: 1, totalSubmissions: 1 },
    })

    // ── 11. Send emails (non-blocking) ────────────────────
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
    Promise.allSettled(emailPromises).then(results => {
      const sent = results.filter(r => r.status === 'fulfilled').length
      Diagnostic.findByIdAndUpdate(diagnostic._id, { emailSent: sent > 0 }).exec()
    })

    return NextResponse.json({
      success: true,
      data: {
        diagnosticId:     diagnostic._id.toString(),
        lendabilityIndex: result.lendabilityIndex,
        classification:   result.classification,
        strategic:        result.strategic.percentage,
        process:          result.process.percentage,
        support:          result.support.percentage,
        bottleneck:       result.bottleneck,
        taCount:          result.taRecommendations.length,
        projectedScore:   result.projectedIndexAfterTA,
        period,
        nextDiagnosticAvailable: nextAvailable.toISOString(),
      },
    })

  } catch (error) {
    console.error('[DIAGNOSTIC SUBMIT ERROR]', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// ── GET - fetch diagnostic by ID ──────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 })

  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    await connectDB()

    const user = await User.findOne({ clerkId: userId }).lean() as any
    if (!user) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

    const query: Record<string, unknown> = { _id: id }
    if (['bank_admin', 'bank_staff'].includes(user.role)) {
      query.tenantId = user.tenantId
    } else if (user.role === 'sme') {
      if (!user.businessId) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
      query.businessId = user.businessId
    } else if (user.role !== 'platform_admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const diagnostic = await Diagnostic.findOne(query).populate('businessId').populate('tenantId').lean()
    if (!diagnostic) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    return NextResponse.json({ success: true, data: diagnostic })
  } catch (error) {
    console.error('[DIAGNOSTIC GET ERROR]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
