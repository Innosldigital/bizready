// src/app/api/question-bank/import/route.ts
// Accepts CSV or XLSX upload, validates, and syncs to MongoDB

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { writeAuditLog } from '@/lib/audit'
import { connectDB } from '@/lib/db'
import { DiagnosticSection, Question } from '@/models'
import { auth } from '@clerk/nextjs/server'
import { applyRateLimit, getRequestIp } from '@/lib/security/rate-limit'
import { CAPACITY_AREAS } from '@/types'
import * as XLSX from 'xlsx'

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
  area_id?: string; area_number?: string; parameter_id?: string; section_order?: string
  opt_a?: string; opt_b?: string; opt_c?: string; opt_d?: string; opt_e?: string
  score_a?: string; score_b?: string; score_c?: string; score_d?: string; score_e?: string
  is_required: string; is_active: string
}

type CapacityArea = (typeof CAPACITY_AREAS)[number]

const AREA_BY_KEY = new Map<string, CapacityArea>(CAPACITY_AREAS.map((area) => [area.key, area]))
const AREA_BY_NAME = new Map<string, CapacityArea>(CAPACITY_AREAS.map((area) => [area.name.trim().toLowerCase(), area]))

function splitCSVLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let index = 0; index < line.length; index++) {
    const char = line[index]
    const next = line[index + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"'
        index++
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      values.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  values.push(current.trim())
  return values
}

function parseCSV(text: string): ImportRow[] {
  const lines = text.replace(/\r/g, '').split('\n').map(l => l.trim()).filter(Boolean)
  if (!lines.length) throw new Error('Empty file')
  const headers = splitCSVLine(lines[0]).map(h => h.replace(/^"|"$/g,''))
  const missing = REQUIRED_COLS.filter(c => !headers.includes(c))
  if (missing.length) throw new Error(`Missing columns: ${missing.join(', ')}`)
  return lines.slice(1).map(line => {
    const vals = splitCSVLine(line).map(v => v.replace(/^"|"$/g,''))
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] || ''])) as unknown as ImportRow
  })
}

async function parseXlsx(file: File): Promise<ImportRow[]> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(Buffer.from(buffer), { type: 'buffer' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) throw new Error('Excel file contains no sheets')
  const sheet = workbook.Sheets[sheetName]
  const jsonRows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' })
  if (!jsonRows.length) throw new Error('Empty file')
  const missing = REQUIRED_COLS.filter(c => !(c in jsonRows[0]))
  if (missing.length) throw new Error(`Missing columns: ${missing.join(', ')}`)
  return jsonRows as unknown as ImportRow[]
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

function resolveArea(row: ImportRow): CapacityArea | null {
  return (
    (row.area_id ? AREA_BY_KEY.get(row.area_id.trim()) : undefined) ||
    AREA_BY_NAME.get(row.section_name.trim().toLowerCase()) ||
    null
  )
}

function resolveParameterId(row: ImportRow, area: CapacityArea | null): string {
  if (row.parameter_id?.trim()) return row.parameter_id.trim()
  if (!area) return ''

  const needle = row.question_text.trim().toLowerCase()
  return area.parameters.find((parameter) => parameter.name.trim().toLowerCase() === needle)?.id || ''
}

function resolveSectionOrder(row: ImportRow, area: CapacityArea | null): number {
  const explicitSectionOrder = Number(row.section_order)
  if (Number.isFinite(explicitSectionOrder) && explicitSectionOrder > 0) return explicitSectionOrder

  const explicitAreaNumber = Number(row.area_number)
  if (Number.isFinite(explicitAreaNumber) && explicitAreaNumber > 0) return explicitAreaNumber

  if (area) return area.number

  const parsedSectionId = parseInt(row.section_id.replace(/[^\d]/g, ''), 10)
  return Number.isFinite(parsedSectionId) && parsedSectionId > 0 ? parsedSectionId : 99
}

export async function POST(req: NextRequest) {
  try {
    const { userId, sessionClaims } = await auth()
    if (!userId) return NextResponse.json({ success: false, error: 'Unauthorised' }, { status: 401 })
    const role = (sessionClaims?.metadata as any)?.role
    if (role !== 'platform_admin') return NextResponse.json({ success: false, error: 'Platform admin only' }, { status: 403 })

    const limited = applyRateLimit(req, {
      namespace: 'question-bank-import',
      key: userId,
      limit: 5,
      windowMs: 10 * 60 * 1000,
      message: 'Too many import attempts. Please wait before uploading again.',
    })
    if (limited) return limited

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 })

    const isXlsx = file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
    const isCsv  = file.name.endsWith('.csv')
    if (!isCsv && !isXlsx) {
      return NextResponse.json({ success: false, error: 'Only CSV or Excel (.xlsx) files are supported.' }, { status: 400 })
    }

    let rows: ImportRow[]
    try {
      if (isXlsx) {
        rows = await parseXlsx(file)
      } else {
        const text = await file.text()
        rows = parseCSV(text)
      }
    } catch (e: any) {
      return NextResponse.json({ success: false, error: `Parse error: ${e.message}` }, { status: 400 })
    }

    if (!rows.length) return NextResponse.json({ success: false, error: 'No data rows found' }, { status: 400 })

    await connectDB()

    const mappingErrors = rows.flatMap((row, index) => {
      const errors: string[] = []
      const area = resolveArea(row)
      const parameterId = resolveParameterId(row, area)

      if (!area) {
        errors.push(`Row ${index + 2}: section "${row.section_name}" does not map to a supported capacity area.`)
      }
      if (!parameterId) {
        errors.push(`Row ${index + 2}: question "${row.question_text}" is missing a resolvable parameter ID.`)
      }

      return errors
    })

    if (mappingErrors.length) {
      return NextResponse.json({
        success: false,
        error: `Import metadata validation failed:\n${mappingErrors.slice(0, 10).join('\n')}`,
      }, { status: 422 })
    }

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
      const area = resolveArea(sample)
      const weight = parseFloat(sample.section_weight?.replace('%','')) / 100 || 0
      const areaId = sample.area_id?.trim() || area?.key || ''
      const order = resolveSectionOrder(sample, area)
      const sec = await DiagnosticSection.findOneAndUpdate(
        areaId ? { areaId } : { name: meta.name },
        {
          name:          meta.name,
          capacityLevel: area?.level || sample.capacity_level,
          weight,
          maxPoints:     meta.max,
          description:   `${meta.name} - imported`,
          isActive:      true,
          order,
          areaId,
          areaNumber:    order,
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
      const area = resolveArea(row)
      const parameterId = resolveParameterId(row, area)

      await Question.findOneAndUpdate(
        parameterId ? { sectionId, parameterId } : { sectionId, text: row.question_text.trim() },
        {
          sectionId,
          areaId:      row.area_id?.trim() || area?.key || '',
          parameterId,
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

    await writeAuditLog({
      actorClerkId: userId,
      actorRole: role,
      action: 'question_bank.imported',
      resourceType: 'question_bank',
      status: 'success',
      ipAddress: getRequestIp(req),
      details: {
        sectionsUpserted: Object.keys(sectionMap).length,
        questionsImported: imported,
        questionsSkipped: skipped,
        fileName: file.name,
      },
    })

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

// ── GET - export current question bank as CSV ──────────────
export async function GET(req: NextRequest) {
  const { userId, sessionClaims } = await auth()
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorised' }, { status: 401 })
  const role = (sessionClaims?.metadata as any)?.role
  if (role !== 'platform_admin') return NextResponse.json({ success: false, error: 'Platform admin only' }, { status: 403 })

  await connectDB()
  const sections = await DiagnosticSection.find({ isActive: true }).sort({ order: 1 }).lean()
  const questions = await Question.find({ isActive: true }).sort({ sectionId: 1, order: 1 }).lean()

  const sectionMap = Object.fromEntries(sections.map(s => [(s as any)._id.toString(), s]))

  const headers = ['section_id','section_order','section_name','capacity_level','section_weight','section_max_points','area_id','area_number','parameter_id','q_order','question_text','hint','question_type','opt_a','opt_b','opt_c','opt_d','opt_e','score_a','score_b','score_c','score_d','score_e','is_required','is_active']

  const csvRows = questions.map((q, i) => {
    const sec = sectionMap[(q as any).sectionId?.toString()]
    const opts = (q as any).options || []
    const row: Record<string, string> = {
      section_id:          sec ? `S${String(sec.order).padStart(2,'0')}` : 'S00',
      section_order:       String(sec?.order || 0),
      section_name:        sec?.name || '',
      capacity_level:      sec?.capacityLevel || '',
      section_weight:      sec ? `${Math.round((sec.weight||0)*100)}%` : '0%',
      section_max_points:  String(sec?.maxPoints || 0),
      area_id:             sec?.areaId || (q as any).areaId || '',
      area_number:         String(sec?.areaNumber || sec?.order || 0),
      parameter_id:        (q as any).parameterId || '',
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
