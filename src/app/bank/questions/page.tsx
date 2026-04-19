// src/app/bank/questions/page.tsx
// Bank admin: view platform questions + manage tenant-specific questions

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db'
import { User, DiagnosticSection, Question } from '@/models'
import BankQuestionsClient from './BankQuestionsClient'

export default async function BankQuestionsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  await connectDB()

  const user = await User.findOne({ clerkId: userId }).lean() as any
  if (!user || !['bank_admin', 'platform_admin'].includes(user.role)) redirect('/dashboard')

  const tenantId = String(user.tenantId)

  const [platformSections, tenantSections, platformQuestions, tenantQuestions] = await Promise.all([
    DiagnosticSection.find({ source: 'platform', tenantId: null }).sort({ order: 1 }).lean(),
    DiagnosticSection.find({ source: 'tenant', tenantId }).sort({ order: 1 }).lean(),
    Question.find({ source: 'platform', tenantId: null }).sort({ order: 1 }).lean(),
    Question.find({ source: 'tenant', tenantId }).sort({ order: 1 }).lean(),
  ])

  return (
    <BankQuestionsClient
      platformSections={JSON.parse(JSON.stringify(platformSections))}
      tenantSections={JSON.parse(JSON.stringify(tenantSections))}
      platformQuestions={JSON.parse(JSON.stringify(platformQuestions))}
      initialTenantQuestions={JSON.parse(JSON.stringify(tenantQuestions))}
    />
  )
}
