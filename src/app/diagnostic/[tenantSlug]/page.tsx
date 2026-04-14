// src/app/diagnostic/[tenantSlug]/page.tsx
// Public page — SMEs access this via link from their bank
// e.g. lendiq.io/diagnostic/uba-sl

import { connectDB } from '@/lib/db'
import { Tenant, DiagnosticSection, Question } from '@/models'
import { notFound } from 'next/navigation'
import { generateThemeCSS } from '@/lib/theme'
import DiagnosticForm from '@/components/diagnostic/DiagnosticForm'
import { auth } from '@clerk/nextjs/server'

interface PageProps {
  params: { tenantSlug: string }
}

export async function generateMetadata({ params }: PageProps) {
  return {
    title: `SME Investment Readiness Diagnostic — ${params.tenantSlug.toUpperCase()}`,
    description: 'Complete your business diagnostic to receive your Investment Readiness Index and personalised Technical Assistance recommendations.',
  }
}

export default async function DiagnosticPage({ params }: PageProps) {
  await connectDB()

  // Resolve tenant
  const tenant = await Tenant.findOne({ slug: params.tenantSlug, isActive: true }).lean() as any
  if (!tenant) notFound()

  // Load active question sections with questions
  const rawSections = await DiagnosticSection.find({ isActive: true }).sort({ order: 1 }).lean()
  const sections = await Promise.all(
    rawSections.map(async section => {
      const questions = await Question.find({
        sectionId: section._id, isActive: true
      }).sort({ order: 1 }).lean()
      return { ...section, questions }
    })
  )

  // Get logged-in user if any
  const { userId } = await auth()

  // Inject theme CSS
  const themeCSS = generateThemeCSS(tenant.theme as any)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: themeCSS }} />
      <DiagnosticForm
        tenantSlug={params.tenantSlug}
        theme={tenant.theme as any}
        sections={sections as any}
        userId={userId || undefined}
      />
    </>
  )
}
