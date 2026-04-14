// src/app/api/question-bank/import/route.ts
// Accepts CSV or XLSX upload, validates, and syncs to MongoDB

import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { DiagnosticSection, Question } from '@/models'
import { auth } from '@clerk/nextjs/server'

// Expected CSV columns
const REQUIRED_COLS = [
  'section_id','section_name','capacity_level','section_weight',
  'section_max_points','q_order','question_text','question_type',
  'opt_a','score_a','is_required','is_active'
]

interface ImportRow {
  section_id: string; section_name: string; capacity_level: string
  section_weight: string; section_max_points: string; q_order: string
  question_text: string; hint?: string; question_type: string
  opt_a?: string; opt_b?: string; opt_c?: string; opt_d?: string; opt_e?: string
  score_a?: string; score_b?: string; score_c?: string; score_d?: string; score_e?: string
  is_required: string; is_active: string
}

function parseCSV(text: string): ImportRow[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  if (!lines.length) throw new Error('Empty file')
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g,''))
  const missing = REQUIRED_COLS.filter(c => !headers.includes(c))
  if (missing.length) throw new Error(`Missing columns: ${missing.join(', ')}`)
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g,''))
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] || ''])) as unknown as ImportRow
  })
}

function buildOptions(row: ImportRow) {
  const opts = []
  const letters = ['a','b','c','d','e'] as const
  for (const l of letters) {
    const text  = row[`opt_${l}` as keyof ImportRow] || ''
    const score = parseInt(row[`score_${l}` as keyof ImportRow] || '0')
    if (text) opts.push({ text, score })
  }
  return opts
}

export async function POST(req: NextRequest) {
  try {
    const { userId, sessionClaims } = await auth()
    if (!userId) return NextResponse.json({ success: false, error: 'Unauthorised' }, { status: 401 })
    const role = (sessionClaims?.metadata as any)?.role
    if (role !== 'platform_admin') return NextResponse.json({ success: false, error: 'Platform admin only' }, { status: 403 })

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 })

    // Only accept CSV for now (XLSX support via xlsx package in a future PR)
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ success: false, error: 'Only CSV files are supported. Export your Excel file as CSV first.' }, { status: 400 })
    }

    const text = await file.text()
    let rows: ImportRow[]
    try {
      rows = parseCSV(text)
    } catch (e: any) {
      return NextResponse.json({ success: false, error: `Parse error: ${e.message}` }, { status: 400 })
    }

    if (!rows.length) return NextResponse.json({ success: false, error: 'No data rows found' }, { status: 400 })

    await connectDB()

    // ── VALIDATE SECTION SCORE LIMITS ─────────────────────────
    const sectionTotals: Record<string, { max: number; sum: number; name: string }> = {}
    for (const row of rows) {
      const sid = row.section_id
      if (!sectionTotals[sid]) {
        sectionTotals[sid] = { max: parseInt(row.section_max_points) || 0, sum: 0, name: row.section_name }
      }
      const opts = buildOptions(row)
      const qMax = opts.length ? Math.max(...opts.map(o => o.score)) : 0
      sectionTotals[sid].sum += qMax
    }

    const violations = Object.entries(sectionTotals)
      .filter(([, v]) => v.max > 0 && v.sum > v.max)
      .map(([sid, v]) => `${v.name} (${sid}): sum=${v.sum} exceeds max=${v.max}`)

    if (violations.length) {
      return NextResponse.json({
        success: false,
        error: `Score limit violations found. Fix before re-uploading:\n${violations.join('\n')}`,
      }, { status: 422 })
    }

    // ── UPSERT SECTIONS ────────────────────────────────────────
    const sectionMap: Record<string, any> = {}
    for (const [sid, meta] of Object.entries(sectionTotals)) {
      const sample = rows.find(r => r.section_id === sid)!
      const weight = parseFloat(sample.section_weight?.replace('%','')) / 100 || 0
      const sec = await DiagnosticSection.findOneAndUpdate(
        { name: meta.name },
        {
          name:          meta.name,
          capacityLevel: sample.capacity_level,
          weight,
          maxPoints:     meta.max,
          description:   `${meta.name} — imported`,
          isActive:      true,
          order:         parseInt(sid.replace('S','')) || 99,
        },
        { upsert: true, new: true }
      )
      sectionMap[sid] = sec._id
    }

    // ── UPSERT QUESTIONS ───────────────────────────────────────
    let imported = 0, skipped = 0
    for (const row of rows) {
      if (!row.question_text?.trim()) { skipped++; continue }
      const sectionId = sectionMap[row.section_id]
      if (!sectionId) { skipped++; continue }

      await Question.findOneAndUpdate(
        { sectionId, text: row.question_text.trim() },
        {
          sectionId,
          text:       row.question_text.trim(),
          hint:       row.hint || '',
          type:       row.question_type || 'mcq',
          options:    buildOptions(row),
          order:      parseInt(row.q_order) || 99,
          isRequired: row.is_required?.toLowerCase() !== 'no',
          isActive:   row.is_active?.toLowerCase() !== 'no',
        },
        { upsert: true, new: true }
      )
      imported++
    }

    return NextResponse.json({
      success: true,
      data: {
        sectionsUpserted: Object.keys(sectionMap).length,
        questionsImported: imported,
        questionsSkipped:  skipped,
        message: `Successfully imported ${imported} questions across ${Object.keys(sectionMap).length} sections.`,
      },
    })

  } catch (error) {
    console.error('[QUESTION BANK IMPORT ERROR]', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// ── GET — export current question bank as CSV ──────────────
export async function GET(req: NextRequest) {
  const { userId, sessionClaims } = await auth()
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorised' }, { status: 401 })
  const role = (sessionClaims?.metadata as any)?.role
  if (role !== 'platform_admin') return NextResponse.json({ success: false, error: 'Platform admin only' }, { status: 403 })

  await connectDB()
  const sections = await DiagnosticSection.find({ isActive: true }).sort({ order: 1 }).lean()
  const questions = await Question.find({ isActive: true }).sort({ sectionId: 1, order: 1 }).lean()

  const sectionMap = Object.fromEntries(sections.map(s => [(s as any)._id.toString(), s]))

  const headers = ['section_id','section_name','capacity_level','section_weight','section_max_points','q_order','question_text','hint','question_type','opt_a','opt_b','opt_c','opt_d','opt_e','score_a','score_b','score_c','score_d','score_e','is_required','is_active']

  const csvRows = questions.map((q, i) => {
    const sec = sectionMap[(q as any).sectionId?.toString()]
    const opts = (q as any).options || []
    const row: Record<string, string> = {
      section_id:          sec ? `S${String(sec.order).padStart(2,'0')}` : 'S00',
      section_name:        sec?.name || '',
      capacity_level:      sec?.capacityLevel || '',
      section_weight:      sec ? `${Math.round((sec.weight||0)*100)}%` : '0%',
      section_max_points:  String(sec?.maxPoints || 0),
      q_order:             String((q as any).order || i+1),
      question_text:       (q as any).text || '',
      hint:                (q as any).hint || '',
      question_type:       (q as any).type || 'mcq',
      is_required:         (q as any).isRequired ? 'Yes' : 'No',
      is_active:           (q as any).isActive ? 'Yes' : 'No',
    }
    for (let j = 0; j < 5; j++) {
      const letter = ['a','b','c','d','e'][j]
      row[`opt_${letter}`]   = opts[j]?.text  || ''
      row[`score_${letter}`] = String(opts[j]?.score ?? 0)
    }
    return headers.map(h => `"${(row[h]||'').replace(/"/g,'""')}"`).join(',')
  })

  const csv = [headers.join(','), ...csvRows].join('\n')
  return new NextResponse(csv, {
    headers: {
      'Content-Type':        'text/csv',
      'Content-Disposition': 'attachment; filename="lendiq-question-bank-export.csv"',
    },
  })
}
