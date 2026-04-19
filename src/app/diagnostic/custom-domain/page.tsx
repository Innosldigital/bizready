// src/app/diagnostic/custom-domain/page.tsx
// Handles requests arriving on a tenant's custom domain (e.g. diagnostic.mybank.com).
// Middleware rewrites the request here and injects x-custom-domain header.

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { connectDB } from '@/lib/db'
import { Tenant, DiagnosticSection, Question } from '@/models'
import { generateThemeCSS } from '@/lib/theme'
import DiagnosticForm from '@/components/diagnostic/DiagnosticForm'
import { auth } from '@clerk/nextjs/server'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const headersList = headers()
  const domain = headersList.get('x-custom-domain') ?? ''
  await connectDB()
  const tenant = await Tenant.findOne({ customDomain: domain, isActive: true }).lean() as any
  if (!tenant) return { title: 'Business Diagnostic' }
  return {
    title: `SME Investment Readiness Diagnostic — ${tenant.theme?.bankName ?? tenant.name}`,
    description: 'Complete your business diagnostic to receive your Investment Readiness Index and personalised Technical Assistance recommendations.',
  }
}

export default async function CustomDomainDiagnosticPage() {
  const headersList = headers()
  const domain = headersList.get('x-custom-domain') ?? ''

  if (!domain) notFound()

  await connectDB()

  // Resolve tenant by custom domain
  const tenant = await Tenant.findOne({ customDomain: domain, isActive: true }).lean() as any
  if (!tenant) notFound()

  // Load question bank (same as standard diagnostic route)
  const rawSections = await DiagnosticSection.find({ isActive: true }).sort({ order: 1 }).lean()
  const sections = await Promise.all(
    rawSections.map(async section => {
      const questions = await Question.find({ sectionId: section._id, isActive: true }).sort({ order: 1 }).lean()
      return { ...section, questions }
    })
  )

  const { userId } = await auth()
  const themeCSS    = generateThemeCSS(tenant.theme as any)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: themeCSS }} />
      <DiagnosticForm
        tenantSlug={tenant.slug}
        theme={tenant.theme as any}
        userId={userId || undefined}
        sections={sections as any}
      />
    </>
  )
}
