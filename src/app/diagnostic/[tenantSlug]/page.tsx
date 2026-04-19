// src/app/diagnostic/[tenantSlug]/page.tsx
// Public page - SMEs access this via link from their bank

import { connectDB } from '@/lib/db'
import { Tenant, DiagnosticSection, Question, Diagnostic, Business } from '@/models'
import { notFound } from 'next/navigation'
import { generateThemeCSS } from '@/lib/theme'
import DiagnosticForm from '@/components/diagnostic/DiagnosticForm'
import { auth } from '@clerk/nextjs/server'

interface PageProps {
  params: { tenantSlug: string }
}

export async function generateMetadata({ params }: PageProps) {
  return {
    title: `SME Investment Readiness Diagnostic - ${params.tenantSlug.toUpperCase()}`,
    description: 'Complete your business diagnostic to receive your Investment Readiness Index and personalised Technical Assistance recommendations.',
  }
}

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000

export default async function DiagnosticPage({ params }: PageProps) {
  await connectDB()

  const tenant = await Tenant.findOne({ slug: params.tenantSlug, isActive: true }).lean() as any
  if (!tenant) notFound()

  const { userId } = await auth()

  // 3-month restriction check
  let restrictedUntil: Date | null = null
  let existingDiagnosticId: string | null = null

  if (userId) {
    const business = await Business.findOne({ tenantId: tenant._id, userId }).lean() as any
    if (business) {
      const lastDiag = await Diagnostic.findOne(
        { tenantId: tenant._id, businessId: business._id, status: { $in: ['submitted', 'scored', 'reported'] } },
        { submittedAt: 1, nextDiagnosticAvailable: 1, _id: 1 },
      ).sort({ submittedAt: -1 }).lean() as any

      if (lastDiag) {
        const available = lastDiag.nextDiagnosticAvailable
          ?? new Date((lastDiag.submittedAt?.getTime() ?? 0) + NINETY_DAYS_MS)

        if (available > new Date()) {
          restrictedUntil = available
        }
        existingDiagnosticId = String(lastDiag._id)
      }
    }
  }

  // Load platform questions + tenant-specific questions merged per section
  const [platformSections, tenantSections] = await Promise.all([
    DiagnosticSection.find({ isActive: true, source: 'platform', tenantId: null }).sort({ order: 1 }).lean(),
    DiagnosticSection.find({ isActive: true, source: 'tenant', tenantId: tenant._id }).sort({ order: 1 }).lean(),
  ])

  // Build merged section list — platform sections first, then any tenant-only sections
  const allSectionDocs = [...platformSections, ...tenantSections]

  const sections = await Promise.all(
    allSectionDocs.map(async section => {
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

  // Only include sections that have at least one active question
  const activeSections = sections.filter(s => s.questions.length > 0)

  const themeCSS = generateThemeCSS(tenant.theme as any)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: themeCSS }} />
      <DiagnosticForm
        tenantSlug={params.tenantSlug}
        theme={tenant.theme as any}
        userId={userId ?? undefined}
        sections={activeSections as any}
        restrictedUntil={restrictedUntil?.toISOString() ?? null}
        existingDiagnosticId={existingDiagnosticId}
      />
    </>
  )
}
