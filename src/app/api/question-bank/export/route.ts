// src/app/api/question-bank/export/route.ts
// Export the question bank as a CSV file

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { connectDB } from '@/lib/db'
import { User, DiagnosticSection, Question } from '@/models'

function escapeCsv(val: unknown): string {
  const str = val == null ? '' : String(val)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function row(cells: unknown[]): string {
  return cells.map(escapeCsv).join(',')
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  await connectDB()
  const user = await User.findOne({ clerkId: userId }).lean() as any
  if (!user || !['platform_admin', 'bank_admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const sections  = await DiagnosticSection.find({ isActive: true }).sort({ order: 1 }).lean() as any[]
  const questions = await Question.find({ isActive: true }).sort({ order: 1 }).lean() as any[]

  const sectionMap = new Map(sections.map((s: any) => [String(s._id), s]))

  const header = row([
    'section_id','section_name','capacity_level','section_weight','section_max_points',
    'section_order','area_id','area_number',
    'q_order','question_text','hint','question_type',
    'area_id','parameter_id',
    'opt_a','score_a','opt_b','score_b','opt_c','score_c','opt_d','score_d','opt_e','score_e',
    'is_required','is_active',
  ])

  const lines = [header]

  for (const q of questions) {
    const sec = sectionMap.get(String(q.sectionId)) ?? {}
    const opts = q.options ?? []

    const getOpt  = (i: number) => opts[i]?.text  ?? ''
    const getScore = (i: number) => opts[i]?.score ?? ''

    lines.push(row([
      String(q.sectionId),
      sec.name ?? '',
      sec.capacityLevel ?? '',
      sec.weight ?? '',
      sec.maxPoints ?? '',
      sec.order ?? '',
      sec.areaId ?? '',
      sec.areaNumber ?? '',
      q.order,
      q.text,
      q.hint ?? '',
      q.type,
      q.areaId ?? '',
      q.parameterId ?? '',
      getOpt(0), getScore(0),
      getOpt(1), getScore(1),
      getOpt(2), getScore(2),
      getOpt(3), getScore(3),
      getOpt(4), getScore(4),
      q.isRequired ? '1' : '0',
      q.isActive   ? '1' : '0',
    ]))
  }

  const csv = lines.join('\r\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="bizready-question-bank.csv"',
      'Cache-Control': 'no-store',
    },
  })
}
