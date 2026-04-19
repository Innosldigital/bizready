'use client'
// Client component - multi-step form with live progress tracking
// src/components/diagnostic/DiagnosticForm.tsx
// Full InvestSalone diagnostic - 46 parameters across 12 capacity areas
// Cursor bug fix: all inputs are stable top-level components with autoComplete="off"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { clsx } from 'clsx'
import type { BankTheme } from '@/types'
import { CAPACITY_AREAS, classifyGap, gapColor, gapBg, gapLabel } from '@/types'

// ── TYPES ─────────────────────────────────────────────────
interface ParameterResponse {
  parameterId:   string
  parameterName: string
  areaId:        string
  score:         number  // 0 / 2.5 / 5 / 7.5 / 10
  selectedLabel: string  // "3 – Moderate: ..."
}

interface BusinessInfo {
  name:                string
  ceoName:             string
  email:               string
  phone:               string
  sector:              string
  problemSolving:      string
  proposedSolution:    string
  foundingDate:        string
  district:            string
  registrationStatus:  string
  employeeCount:       string
  femaleEmployeeCount: string
  annualRevenue:       string
  loanPurpose:         string
}

interface DiagnosticFormProps {
  tenantSlug:           string
  theme:                BankTheme
  userId?:              string
  sections?:            FormSectionSource[]
  restrictedUntil?:     string | null   // ISO date — show locked screen if set
  existingDiagnosticId?: string | null
}

interface SubmitResult {
  diagnosticId:     string
  lendabilityIndex: number
  classification:   string
  strategic:        number
  process:          number
  support:          number
  bottleneck:       string
  projectedScore:   number
  period:           string
  areaScores?:      { areaName: string; percentage: number; areaNumber: number }[]
}

// ── STATIC FORM DATA ──────────────────────────────────────
const SCALE_OPTIONS = [
  { label: '1 – Very Poor',  score: 0   },
  { label: '2 – Poor',       score: 2.5 },
  { label: '3 – Moderate',   score: 5   },
  { label: '4 – Good',       score: 7.5 },
  { label: '5 – Excellent',  score: 10  },
]

const SECTORS = [
  'Agriculture & Agro-processing', 'Fisheries & Aquaculture', 'Manufacturing',
  'Trade & Retail', 'Technology & IT Services', 'Construction & Real Estate',
  'Education', 'Healthcare', 'Tourism & Hospitality', 'Financial Services',
  'Transport & Logistics', 'Creative Industries', 'Other',
]

const SL_DISTRICTS = [
  'Western Area Urban (Freetown)', 'Western Area Rural',
  'Bo', 'Bonthe', 'Falaba', 'Kailahun', 'Kambia', 'Karene',
  'Kenema', 'Koinadugu', 'Kono', 'Moyamba', 'Port Loko',
  'Pujehun', 'Tonkolili', 'Other',
]

const REGISTRATION_OPTIONS = [
  { value: 'fully-registered', label: 'Fully registered - Ltd, LLC or equivalent' },
  { value: 'sole-trader',      label: 'Registered as sole trader / individual' },
  { value: 'in-progress',      label: 'Registration in progress' },
  { value: 'not-registered',   label: 'Not yet formally registered' },
]

// Capacity level steps: 0=bizInfo, 1=strategic, 2=process, 3=support, 4=results
const LEVEL_STEPS = [
  { level: 'strategic', label: 'Strategic Capacity', weight: '30%' },
  { level: 'process',   label: 'Process Capacity',   weight: '45%' },
  { level: 'support',   label: 'Support Capacity',   weight: '25%' },
] as const

type SupportedCapacityLevel = (typeof LEVEL_STEPS)[number]['level']

interface FormQuestionSource {
  _id?: string
  text?: string
  hint?: string
  parameterId?: string
  areaId?: string
  order?: number | null
}

interface FormSectionSource {
  name?: string
  capacityLevel?: string
  areaId?: string
  areaNumber?: number | null
  questions?: FormQuestionSource[]
}

interface FormAreaParameter {
  id: string
  name: string
  aspects: string
  areaId: string
  areaName: string
  areaNumber: number
  order: number
}

interface FormArea {
  key: string
  name: string
  number: number
  level: SupportedCapacityLevel
  parameters: FormAreaParameter[]
}

const FALLBACK_AREA_MAP = new Map<string, (typeof CAPACITY_AREAS)[number]>(CAPACITY_AREAS.map(area => [area.key, area]))
const FALLBACK_AREA_NAME_MAP = new Map<string, (typeof CAPACITY_AREAS)[number]>(
  CAPACITY_AREAS.map(area => [area.name.trim().toLowerCase(), area])
)

function isSupportedCapacityLevel(value: string | undefined): value is SupportedCapacityLevel {
  return value === 'strategic' || value === 'process' || value === 'support'
}

function stripAspectsPrefix(value?: string): string {
  return (value || '').replace(/^Aspects assessed:\s*/i, '').trim()
}

function buildFormAreas(sections?: FormSectionSource[]): FormArea[] {
  const overrides = new Map<string, {
    name: string
    number: number
    parameters: Map<string, { name: string; aspects: string; order: number }>
  }>()

  for (const section of sections ?? []) {
    const fallbackArea = (
      (section.areaId ? FALLBACK_AREA_MAP.get(section.areaId) : undefined) ||
      FALLBACK_AREA_NAME_MAP.get((section.name || '').trim().toLowerCase())
    )

    if (!fallbackArea) continue

    const level = isSupportedCapacityLevel(section.capacityLevel)
      ? section.capacityLevel
      : fallbackArea.level

    if (level !== fallbackArea.level) continue

    const parameterOverrides = new Map<string, { name: string; aspects: string; order: number }>()

    for (const question of section.questions ?? []) {
      const fallbackParamIndex = fallbackArea.parameters.findIndex((parameter) =>
        parameter.id === question.parameterId ||
        parameter.name.trim().toLowerCase() === (question.text || '').trim().toLowerCase()
      )
      const fallbackParam = fallbackParamIndex >= 0 ? fallbackArea.parameters[fallbackParamIndex] : null
      const parameterId = question.parameterId || fallbackParam?.id

      if (!parameterId) continue

      const parsedOrder = Number(question.order)
      parameterOverrides.set(parameterId, {
        name: (question.text || fallbackParam?.name || parameterId).trim(),
        aspects: stripAspectsPrefix(question.hint) || fallbackParam?.aspects || '',
        order: Number.isFinite(parsedOrder) && parsedOrder > 0 ? parsedOrder : fallbackParamIndex + 1,
      })
    }

    if (parameterOverrides.size === 0) continue

    overrides.set(fallbackArea.key, {
      name: (section.name || fallbackArea.name).trim(),
      number: Number(section.areaNumber) || fallbackArea.number,
      parameters: parameterOverrides,
    })
  }

  return CAPACITY_AREAS.map((fallbackArea) => {
    const override = overrides.get(fallbackArea.key)
    const areaName = override?.name || fallbackArea.name
    const areaNumber = override?.number || fallbackArea.number

    return {
      key: fallbackArea.key,
      name: areaName,
      number: areaNumber,
      level: fallbackArea.level as SupportedCapacityLevel,
      parameters: fallbackArea.parameters
        .map((fallbackParam, index) => {
          const parameterOverride = override?.parameters.get(fallbackParam.id)
          return {
            id: fallbackParam.id,
            name: parameterOverride?.name || fallbackParam.name,
            aspects: parameterOverride?.aspects || fallbackParam.aspects,
            areaId: fallbackArea.key,
            areaName,
            areaNumber,
            order: parameterOverride?.order ?? index + 1,
          }
        })
        .sort((left, right) => left.order - right.order),
    }
  })
}

// ── MAIN COMPONENT ────────────────────────────────────────
export default function DiagnosticForm({ tenantSlug, theme, userId, sections = [], restrictedUntil, existingDiagnosticId }: DiagnosticFormProps) {
  const [step,       setStep]       = useState(0)  // 0=bizInfo, 1-3=levels, 4=results
  const [bizInfo,    setBizInfo]    = useState<Partial<BusinessInfo>>({})
  const [responses,  setResponses]  = useState<Record<string, ParameterResponse>>({})
  const [currentIdx, setCurrentIdx] = useState(0)  // index within current level's parameters
  const [submitting, setSubmitting] = useState(false)
  const [result,     setResult]     = useState<SubmitResult | null>(null)
  const [errors,     setErrors]     = useState<Record<string, string>>({})
  const [savedAt,    setSavedAt]    = useState('')
  const questionAreas = useMemo(() => buildFormAreas(sections), [sections])

  // Flat list of all parameters for the current level step
  const levelAreas = useMemo(() =>
    step >= 1 && step <= 3
      ? questionAreas.filter(a => a.level === LEVEL_STEPS[step - 1].level)
      : [],
    [questionAreas, step]
  )

  const levelParams = useMemo(() =>
    levelAreas.flatMap(area =>
      area.parameters.map(p => ({ ...p, areaId: area.key, areaName: area.name, areaNumber: area.number }))
    ),
    [levelAreas]
  )

  const currentParam = levelParams[currentIdx] || null

  // Progress calculation
  const totalParams    = questionAreas.reduce((s, a) => s + a.parameters.length, 0)
  const answeredParams = Object.keys(responses).length
  const overallPct     = step === 0 ? 5
    : Math.round(5 + (answeredParams / Math.max(totalParams, 1)) * 90)

  // Running lendability estimate (simple weighted)
  const runningScore = useMemo(() => {
    if (answeredParams === 0) return null
    const byLevel = { strategic: { raw: 0, max: 0 }, process: { raw: 0, max: 0 }, support: { raw: 0, max: 0 } }
    for (const area of questionAreas) {
      const lvl = area.level as keyof typeof byLevel
      for (const param of area.parameters) {
        const r = responses[param.id]
        if (r) {
          byLevel[lvl].raw += r.score
          byLevel[lvl].max += 10
        }
      }
    }
    const sPct = byLevel.strategic.max > 0 ? byLevel.strategic.raw / byLevel.strategic.max * 100 : 0
    const pPct = byLevel.process.max   > 0 ? byLevel.process.raw   / byLevel.process.max   * 100 : 0
    const suPct = byLevel.support.max  > 0 ? byLevel.support.raw   / byLevel.support.max   * 100 : 0
    return Math.round(sPct * 0.30 + pPct * 0.45 + suPct * 0.25)
  }, [questionAreas, responses, answeredParams])

  // ── AUTO-SAVE ──────────────────────────────────────────
  const saveKey = `bizready-draft-${tenantSlug}`

  useEffect(() => {
    try {
      const saved = localStorage.getItem(saveKey)
      if (saved) {
        const { bizInfo: b, responses: r, step: s, currentIdx: ci } = JSON.parse(saved)
        if (b)  setBizInfo(b)
        if (r)  setResponses(r)
        if (s)  setStep(s)
        if (ci) setCurrentIdx(ci)
      }
    } catch {}
  }, [saveKey])

  const autosave = useCallback(() => {
    try {
      localStorage.setItem(saveKey, JSON.stringify({ bizInfo, responses, step, currentIdx }))
      setSavedAt(new Date().toLocaleTimeString())
    } catch {}
  }, [saveKey, bizInfo, responses, step, currentIdx])

  useEffect(() => {
    const t = setInterval(autosave, 30_000)
    return () => clearInterval(t)
  }, [autosave])

  // ── BIZ INFO HANDLERS (stable via useCallback) ─────────
  const handleBizField = useCallback((field: keyof BusinessInfo) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setBizInfo(prev => ({ ...prev, [field]: e.target.value }))
    }, [])

  // ── VALIDATION ─────────────────────────────────────────
  function validateBizInfo(): boolean {
    const errs: Record<string, string> = {}
    if (!bizInfo.name?.trim())        errs.name    = 'Business name is required'
    if (!bizInfo.ceoName?.trim())     errs.ceoName = 'CEO / Owner name is required'
    if (!bizInfo.email?.includes('@')) errs.email  = 'Valid email address is required'
    if (!bizInfo.sector)              errs.sector  = 'Please select a sector'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function startDiagnostic() {
    if (!validateBizInfo()) return
    autosave()
    setStep(1)
    setCurrentIdx(0)
  }

  // ── ANSWER SELECTION ───────────────────────────────────
  function selectScore(score: number, label: string) {
    if (!currentParam) return
    setResponses(prev => ({
      ...prev,
      [currentParam.id]: {
        parameterId:   currentParam.id,
        parameterName: currentParam.name,
        areaId:        currentParam.areaId,
        score,
        selectedLabel: label,
      },
    }))
    // Auto-advance after 300ms
    setTimeout(() => advanceParam(), 300)
  }

  function advanceParam() {
    if (currentIdx < levelParams.length - 1) {
      setCurrentIdx(prev => prev + 1)
    } else if (step < 3) {
      autosave()
      setStep(prev => prev + 1)
      setCurrentIdx(0)
    } else {
      handleSubmit()
    }
  }

  function goBack() {
    if (currentIdx > 0) {
      setCurrentIdx(prev => prev - 1)
    } else if (step > 1) {
      const prevLevel  = questionAreas.filter(a => a.level === LEVEL_STEPS[step - 2].level)
      const prevParams = prevLevel.flatMap(a => a.parameters)
      setStep(prev => prev - 1)
      setCurrentIdx(prevParams.length - 1)
    } else {
      setStep(0)
    }
  }

  // ── SUBMIT ─────────────────────────────────────────────
  async function handleSubmit() {
    setSubmitting(true)
    autosave()
    try {
      const res = await fetch('/api/diagnostic/submit', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantSlug,
          business:  bizInfo,
          responses: Object.values(responses).map(r => ({
            questionId:     r.parameterId,
            questionText:   r.parameterName,
            selectedOption: r.selectedLabel,
            score:          r.score,
            areaId:         r.areaId,
            parameterId:    r.parameterId,
          })),
          userId,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setResult(data.data)
        localStorage.removeItem(saveKey)
      } else {
        alert('Submission failed. Please try again.')
        setSubmitting(false)
      }
    } catch {
      alert('Network error. Please check your connection and try again.')
      setSubmitting(false)
    }
  }

  // ── 3-MONTH RESTRICTION GATE ─────────────────────────────
  if (restrictedUntil) {
    const unlockDate = new Date(restrictedUntil)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Diagnostic Not Yet Available</h2>
          <p className="text-sm text-gray-500 mb-4">
            Your business completed a diagnostic recently. A new assessment is available after 90 days.
          </p>
          <div className="bg-amber-50 rounded-xl px-4 py-3 mb-6">
            <p className="text-xs text-amber-700 font-medium">Next diagnostic available:</p>
            <p className="text-sm font-semibold text-amber-900 mt-0.5">
              {unlockDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <p className="text-xs text-gray-400">Contact your bank relationship manager if you have questions.</p>
        </div>
      </div>
    )
  }

  // ── RESULT SCREEN ──────────────────────────────────────
  if (result) {
    return (
      <ResultScreen
        result={result}
        theme={theme}
        bizName={bizInfo.name || 'Your business'}
        bizEmail={bizInfo.email || ''}
      />
    )
  }

  if (submitting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-12 h-12 border-4 border-gray-200 rounded-full animate-spin"
          style={{ borderTopColor: theme.primary }} />
        <p className="text-sm text-gray-500">Calculating your lendability index…</p>
        <p className="text-xs text-gray-400">Scoring across all 12 capacity areas</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#f4f5f7' }}>

      {/* Bank header */}
      <div style={{ background: theme.primary }} className="px-6 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-md flex items-center justify-center text-xs font-medium text-white"
          style={{ background: 'rgba(255,255,255,0.2)' }}>
          {theme.abbreviation}
        </div>
        <div>
          <p className="text-sm font-medium text-white">{theme.bankName}</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>SME Lendability Diagnostic · Powered by BizReady</p>
        </div>
        {runningScore !== null && step > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[10px] text-white/60">Running score</span>
            <span className="text-sm font-semibold text-white">{runningScore}%</span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="px-6 pt-4 max-w-2xl mx-auto">
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-2">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${overallPct}%`, background: theme.primary }} />
        </div>

        {/* Step pills */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {['Business info', 'Strategic (30%)', 'Process (45%)', 'Support (25%)', 'Complete'].map((label, i) => (
            <span key={i} className={clsx(
              'text-[10px] px-2.5 py-1 rounded-full whitespace-nowrap border flex-shrink-0',
              i === step ? 'text-white border-transparent' : i < step ? 'border-transparent' : 'bg-gray-100 text-gray-400 border-gray-100'
            )} style={
              i === step ? { background: theme.primary } :
              i < step  ? { background: theme.primaryLight, color: theme.primary, borderColor: theme.primary } : {}
            }>
              {i < step ? `✓ ${label}` : label}
            </span>
          ))}
        </div>
        {savedAt && <p className="text-[10px] text-gray-400 mb-2">Saved {savedAt}</p>}
      </div>

      <div className="max-w-2xl mx-auto px-6 pb-12">

        {/* ── STEP 0: BUSINESS INFO ──────────────────────── */}
        {step === 0 && (
          <BizInfoStep
            bizInfo={bizInfo}
            errors={errors}
            theme={theme}
            handleBizField={handleBizField}
            onStart={startDiagnostic}
          />
        )}

        {/* ── STEPS 1–3: PARAMETER QUESTIONS ───────────── */}
        {step >= 1 && step <= 3 && currentParam && (
          <ParameterQuestion
            step={step}
            levelLabel={LEVEL_STEPS[step - 1].label}
            levelWeight={LEVEL_STEPS[step - 1].weight}
            currentParam={currentParam}
            levelParams={levelParams}
            currentIdx={currentIdx}
            responses={responses}
            theme={theme}
            onSelect={selectScore}
            onBack={goBack}
            onNext={advanceParam}
            isLast={step === 3 && currentIdx === levelParams.length - 1}
          />
        )}
      </div>
    </div>
  )
}

// ── BIZ INFO STEP ──────────────────────────────────────────
// Defined OUTSIDE the parent component to avoid re-creation on every render
// (fixes cursor/focus loss bug)
function BizInfoStep({
  bizInfo, errors, theme, handleBizField, onStart,
}: {
  bizInfo: Partial<BusinessInfo>
  errors: Record<string, string>
  theme: BankTheme
  handleBizField: (f: keyof BusinessInfo) => (e: any) => void
  onStart: () => void
}) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100">
      <div className="mb-5">
        <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: theme.primary }}>
          Section 1 - Business Information
        </p>
        <h2 className="text-lg font-medium text-gray-900">Tell us about your business</h2>
        <p className="text-sm text-gray-500 mt-1">
          This helps us personalise your diagnostic and connect you with the right bank relationship manager.
        </p>
      </div>

      <div className="space-y-4">
        {/* Row 1 */}
        <FormInput label="Business name *" value={bizInfo.name || ''} error={errors.name}
          placeholder="e.g. Rickma Fishing Company Ltd"
          onChange={handleBizField('name')} />
        <div className="grid grid-cols-2 gap-4">
          <FormInput label="CEO / Owner full name *" value={bizInfo.ceoName || ''} error={errors.ceoName}
            placeholder="Full name" onChange={handleBizField('ceoName')} />
          <FormInput label="Email address *" type="email" value={bizInfo.email || ''} error={errors.email}
            placeholder="Results sent here" onChange={handleBizField('email')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormInput label="Phone / WhatsApp" type="tel" value={bizInfo.phone || ''}
            placeholder="+232 XX XXX XXXX" onChange={handleBizField('phone')} />
          <FormSelect label="Business sector *" value={bizInfo.sector || ''} error={errors.sector}
            onChange={handleBizField('sector')}
            options={[{ value: '', label: 'Select sector…' }, ...SECTORS.map(s => ({ value: s, label: s }))]} />
        </div>

        <FormTextarea label="Problem your company is trying to solve"
          value={bizInfo.problemSolving || ''} rows={2}
          placeholder="Briefly describe the problem or opportunity your business addresses"
          onChange={handleBizField('problemSolving')} />
        <FormTextarea label="Your proposed solution"
          value={bizInfo.proposedSolution || ''} rows={2}
          placeholder="Briefly describe your product or service"
          onChange={handleBizField('proposedSolution')} />

        <div className="grid grid-cols-2 gap-4">
          <FormInput label="Company founding date" type="date" value={bizInfo.foundingDate || ''}
            onChange={handleBizField('foundingDate')} />
          <FormSelect label="District" value={bizInfo.district || ''}
            onChange={handleBizField('district')}
            options={[{ value: '', label: 'Select district…' }, ...SL_DISTRICTS.map(d => ({ value: d, label: d }))]} />
        </div>

        <FormSelect label="Standard Bureau registration status" value={bizInfo.registrationStatus || ''}
          onChange={handleBizField('registrationStatus')}
          options={[{ value: '', label: 'Select status…' }, ...REGISTRATION_OPTIONS]} />

        <div className="grid grid-cols-2 gap-4">
          <FormSelect label="Total number of employees" value={bizInfo.employeeCount || ''}
            onChange={handleBizField('employeeCount')}
            options={[
              { value: '', label: 'Select…' },
              { value: '1-5',   label: '1 – 5 employees' },
              { value: '6-10',  label: '6 – 10 employees' },
              { value: '11-25', label: '11 – 25 employees' },
              { value: '26-50', label: '26 – 50 employees' },
              { value: '50+',   label: 'More than 50 employees' },
            ]} />
          <FormSelect label="Number of female employees" value={bizInfo.femaleEmployeeCount || ''}
            onChange={handleBizField('femaleEmployeeCount')}
            options={[
              { value: '', label: 'Select…' },
              { value: '0',    label: 'None' },
              { value: '1-3',  label: '1 – 3' },
              { value: '4-10', label: '4 – 10' },
              { value: '11-25',label: '11 – 25' },
              { value: '25+',  label: 'More than 25' },
            ]} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormSelect label="Annual revenue (SLL Millions)" value={bizInfo.annualRevenue || ''}
            onChange={handleBizField('annualRevenue')}
            options={[
              { value: '', label: 'Select range…' },
              { value: '<50m',    label: 'Below SLL 50 million' },
              { value: '50-200m', label: 'SLL 50 – 200 million' },
              { value: '200-500m',label: 'SLL 200 – 500 million' },
              { value: '500m-1b', label: 'SLL 500m – 1 billion' },
              { value: '1b+',     label: 'Above SLL 1 billion' },
            ]} />
          <FormSelect label="Primary purpose of the loan" value={bizInfo.loanPurpose || ''}
            onChange={handleBizField('loanPurpose')}
            options={[
              { value: '', label: 'Select purpose…' },
              { value: 'working-capital', label: 'Working capital / cash flow' },
              { value: 'equipment',       label: 'Equipment / machinery' },
              { value: 'expansion',       label: 'Business expansion' },
              { value: 'stock',           label: 'Stock / inventory' },
              { value: 'technology',      label: 'Technology / IT investment' },
              { value: 'staff',           label: 'Staff recruitment & training' },
              { value: 'other',           label: 'Other' },
            ]} />
        </div>
      </div>

      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-400">Results are confidential and shared only with your relationship manager.</p>
        <button
          onClick={onStart}
          className="px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: theme.primary }}>
          Start diagnostic →
        </button>
      </div>
    </div>
  )
}

// ── PARAMETER QUESTION ─────────────────────────────────────
// Also defined outside parent to avoid re-creation
function ParameterQuestion({
  step, levelLabel, levelWeight, currentParam, levelParams, currentIdx,
  responses, theme, onSelect, onBack, onNext, isLast,
}: {
  step: number
  levelLabel: string
  levelWeight: string
  currentParam: any
  levelParams: any[]
  currentIdx: number
  responses: Record<string, ParameterResponse>
  theme: BankTheme
  onSelect: (score: number, label: string) => void
  onBack: () => void
  onNext: () => void
  isLast: boolean
}) {
  const selectedScore = responses[currentParam.id]?.score

  // Area progress within this level
  const areaParams = levelParams.filter(p => p.areaId === currentParam.areaId)
  const firstIdxInArea = levelParams.findIndex(p => p.areaId === currentParam.areaId)
  const paramIdxInArea = currentIdx - firstIdxInArea

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Area header */}
      <div className="px-6 pt-5 pb-3 border-b border-gray-50">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: theme.primary }}>
            {levelLabel} · {levelWeight} of index
          </p>
          <span className="text-[10px] text-gray-400">
            {currentIdx + 1} / {levelParams.length}
          </span>
        </div>
        <p className="text-xs text-gray-500 font-medium">
          Area {currentParam.areaNumber}: {currentParam.areaName}
        </p>

        {/* Parameter progress within area */}
        <div className="flex gap-1 mt-2">
          {areaParams.map((_, i) => (
            <div key={i}
              className="h-1 flex-1 rounded-full transition-all duration-300"
              style={{ background: i < paramIdxInArea ? theme.primary : i === paramIdxInArea ? theme.primary : '#E5E7EB',
                       opacity: i < paramIdxInArea ? 1 : i === paramIdxInArea ? 1 : 0.3 }} />
          ))}
        </div>
      </div>

      {/* Question */}
      <div className="px-6 py-5">
        <h2 className="text-base font-medium text-gray-900 mb-1">
          {currentParam.name}
        </h2>
        <p className="text-xs text-gray-400 mb-5">
          Aspects assessed: {currentParam.aspects}
        </p>

        {/* Scale options */}
        <div className="flex flex-col gap-2">
          {SCALE_OPTIONS.map((opt) => {
            const isSelected = selectedScore === opt.score
            return (
              <button
                key={opt.score}
                onClick={() => onSelect(opt.score, opt.label)}
                className={clsx(
                  'w-full text-left px-4 py-3 rounded-lg border transition-all duration-150',
                  'flex items-center gap-3 group',
                  isSelected ? 'border-2' : 'border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                )}
                style={isSelected ? { background: theme.primaryLight, borderColor: theme.primary } : {}}
              >
                <div className={clsx(
                  'w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center',
                  isSelected ? '' : 'border-gray-300 group-hover:border-gray-400'
                )} style={isSelected ? { borderColor: theme.primary, background: theme.primary } : {}}>
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <span className={clsx(
                  'text-sm', isSelected ? 'font-medium' : 'text-gray-700'
                )} style={isSelected ? { color: theme.primaryDark } : {}}>
                  {opt.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Nav */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-50">
        <button
          onClick={onBack}
          disabled={step === 1 && currentIdx === 0}
          className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ← Back
        </button>
        <div className="flex flex-col items-center gap-1">
          {selectedScore !== undefined && (
            <button
              onClick={onNext}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ background: theme.primary }}
            >
              {isLast ? 'Submit diagnostic →' : 'Next →'}
            </button>
          )}
          <p className="text-[10px] text-gray-400">Progress saved automatically</p>
        </div>
      </div>
    </div>
  )
}

// ── STABLE FORM FIELD COMPONENTS ──────────────────────────
// Defined at module level (not inside any component) so React never re-creates them

interface LabelledInputProps {
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  type?: string
  error?: string
}

function FormInput({ label, value, onChange, placeholder, type = 'text', error }: LabelledInputProps) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        className={clsx(
          'w-full text-sm px-3 py-2 border rounded-lg bg-white text-gray-900',
          'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
          error ? 'border-red-300' : 'border-gray-200'
        )}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

interface LabelledSelectProps {
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  options: { value: string; label: string }[]
  error?: string
}

function FormSelect({ label, value, onChange, options, error }: LabelledSelectProps) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</label>
      <select
        value={value}
        onChange={onChange}
        className={clsx(
          'w-full text-sm px-3 py-2 border rounded-lg bg-white text-gray-900',
          'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
          error ? 'border-red-300' : 'border-gray-200'
        )}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

interface LabelledTextareaProps {
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  placeholder?: string
  rows?: number
}

function FormTextarea({ label, value, onChange, placeholder, rows = 3 }: LabelledTextareaProps) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</label>
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        autoComplete="off"
        spellCheck={false}
        className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
      />
    </div>
  )
}

// ── RESULT SCREEN ──────────────────────────────────────────
function ResultScreen({ result, theme, bizName, bizEmail }: {
  result: SubmitResult; theme: BankTheme; bizName: string; bizEmail: string
}) {
  const idx   = result.lendabilityIndex
  const color = idx >= 80 ? '#0F6E56' : idx >= 60 ? '#BA7517' : '#A32D2D'
  const bg    = idx >= 80 ? '#E1F5EE' : idx >= 60 ? '#FAEEDA' : '#FCEBEB'
  const label = idx >= 80 ? 'Investment Ready' : idx >= 60 ? 'Conditionally Lendable' : 'High Risk'

  const levels = [
    { label: 'Strategic capacity', value: result.strategic,  weight: '30%' },
    { label: 'Process capacity',   value: result.process,    weight: '45%' },
    { label: 'Support capacity',   value: result.support,    weight: '25%' },
  ]

  return (
    <div className="min-h-screen" style={{ background: '#f4f5f7' }}>
      <div style={{ background: theme.primary }} className="px-6 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-md flex items-center justify-center text-xs font-medium text-white"
          style={{ background: 'rgba(255,255,255,0.2)' }}>{theme.abbreviation}</div>
        <p className="text-sm font-medium text-white">{theme.bankName} · Diagnostic Results</p>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 flex flex-col gap-5">
        {/* Score banner */}
        <div className="bg-white rounded-xl overflow-hidden border border-gray-100">
          <div style={{ background: theme.primary }} className="px-6 py-6 text-center">
            <p className="text-xs text-white/70 mb-2 uppercase tracking-wide">Lendability Index - {result.period}</p>
            <p className="text-6xl font-medium text-white">{idx}%</p>
            <p className="text-lg font-medium mt-2" style={{ color: bg }}>{label}</p>
            <p className="text-xs text-white/60 mt-1">{bizName}</p>
          </div>
          <div className="px-6 py-4 bg-gray-50 text-sm text-gray-600 text-center">
            Results and TA recommendations sent to <strong>{bizEmail}</strong>. A bank relationship manager will contact you within 3 business days.
          </div>
        </div>

        {/* Capacity levels */}
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <p className="text-sm font-medium text-gray-900 mb-4">Capacity level breakdown</p>
          {levels.map(row => {
            const c = row.value >= 80 ? '#0F6E56' : row.value >= 60 ? '#BA7517' : '#A32D2D'
            const gap = classifyGap(row.value)
            return (
              <div key={row.label} className="flex items-center gap-3 mb-3 last:mb-0">
                <span className="text-xs text-gray-500 w-36 flex-shrink-0">{row.label}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-2 rounded-full transition-all duration-700"
                    style={{ width: `${row.value}%`, background: c }} />
                </div>
                <span className="text-xs font-medium w-10 text-right" style={{ color: c }}>{row.value}%</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: gapBg(gap), color: gapColor(gap) }}>
                  {gapLabel(gap)}
                </span>
              </div>
            )
          })}
        </div>

        {/* 12-area breakdown */}
        {result.areaScores && result.areaScores.length > 0 && (
          <div className="bg-white rounded-xl p-5 border border-gray-100">
            <p className="text-sm font-medium text-gray-900 mb-3">12-Area capacity breakdown</p>
            <div className="space-y-2">
              {result.areaScores.sort((a, b) => a.areaNumber - b.areaNumber).map(area => {
                const gap = classifyGap(area.percentage)
                return (
                  <div key={area.areaName} className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 w-4 flex-shrink-0">{area.areaNumber}</span>
                    <span className="text-xs text-gray-600 w-40 flex-shrink-0 truncate">{area.areaName}</span>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-1.5 rounded-full"
                        style={{ width: `${area.percentage}%`, background: gapColor(gap) }} />
                    </div>
                    <span className="text-xs font-medium w-9 text-right" style={{ color: gapColor(gap) }}>
                      {area.percentage}%
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Projected score */}
        <div className="bg-gray-900 rounded-xl px-6 py-5 text-center">
          <p className="text-xs text-gray-400 mb-1">Projected score after completing all TA programmes</p>
          <p className="text-3xl font-medium text-green-400">{result.projectedScore}% - Investment Ready</p>
        </div>

        {/* CTA */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 text-center">
          <p className="text-sm text-gray-600 mb-4">
            Create your SME dashboard account to track your progress and monitor TA programmes.
          </p>
          <a href="/sign-up"
            className="inline-block px-6 py-3 rounded-lg text-sm font-medium text-white"
            style={{ background: theme.primary }}>
            Create my dashboard account →
          </a>
        </div>
      </div>
    </div>
  )
}
