// src/app/admin/questions/page.tsx

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db'
import { User, DiagnosticSection, Question } from '@/models'
import QuestionsClient from './QuestionsClient'

export default async function QuestionBankPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  await connectDB()

  const user = await User.findOne({ clerkId: userId }).lean() as any
  if (!user || user.role !== 'platform_admin') redirect('/dashboard')

  const sections  = await DiagnosticSection.find({ source: 'platform', tenantId: null })
    .sort({ order: 1 }).lean()
  const questions = await Question.find({ source: 'platform', tenantId: null })
    .sort({ sectionId: 1, order: 1 }).lean()

  return (
    <QuestionsClient
      initialSections={JSON.parse(JSON.stringify(sections))}
      initialQuestions={JSON.parse(JSON.stringify(questions))}
    />
  )
}
