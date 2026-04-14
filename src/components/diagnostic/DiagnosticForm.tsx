'use client'
// src/components/diagnostic/DiagnosticForm.tsx
// Linear multi-section diagnostic form with auto-save and real-time progress

import { useState, useEffect, useCallback } from 'react'
import { Button, Input, Select, ProgressBar } from '@/components/ui'
import type { BankTheme, DiagnosticSection, Question } from '@/types'
import { clsx } from 'clsx'

// ── TYPES ─────────────────────────────────────────────────
interface FormResponse {
  questionId:     string
  questionText:   string
  selectedOption: string
  score:          number
}

interface BusinessInfo {
  name:           string
  ceoName:        string
  email:          string
  phone:          string
  sector:         string
  yearsOperating: string
  employeeCount:  string
  annualRevenue:  string
  loanPurpose:    string
  location:       string
}

interface DiagnosticFormProps {
  tenantSlug: string
  theme:      BankTheme
  sections:   DiagnosticSection[]
  userId?:    string
}

interface SubmitResult {
  diagnosticId:     string
  lendabilityIndex: number
  classification:   string
  strategic:        number
  operational:      number
  support:          number
  bottleneck:       string
  projectedScore:   number
  period:           string
}

// ── SECTORS ───────────────────────────────────────────────
const SECTORS = [
  'Agriculture & Agro-processing', 'Fisheries & Aquaculture', 'Manufacturing',
  'Trade & Retail', 'Technology & IT Services', 'Construction & Real Estate',
  'Education', 'Healthcare', 'Tourism & Hospitality', 'Financial Services',
  'Transport & Logistics', 'Creative Industries', 'Other',
]

// ── MAIN COMPONENT ────────────────────────────────────────
export default function DiagnosticForm({ tenantSlug, theme, sections, userId }: DiagnosticFormProps) {
  const [step,         setStep]         = useState(0) // 0 = business info
  const [bizInfo,      setBizInfo]      = useState<Partial<BusinessInfo>>({})
  const [responses,    setResponses]    = useState<Record<string, FormResponse>>({})
  const [currentQ,     setCurrentQ]     = useState(0)
  const [submitting,   setSubmitting]   = useState(false)
  const [result,       setResult]       = useState<SubmitResult | null>(null)
  const [errors,       setErrors]       = useState<Record<string, string>>({})
  const [savedAt,      setSavedAt]      = useState<string>('')

  // Scored sections only (exclude info/final for progress calculation)
  const scoredSections = sections.filter(s => ['strategic', 'operational', 'support'].includes(s.capacityLevel))
  const totalSections  = scoredSections.length
  const totalQuestions = scoredSections.reduce((sum, s) => sum + s.questions.length, 0)
  const answeredQ      = Object.keys(responses).length

  const overallProgress = step === 0 ? 5
    : Math.round(5 + (answeredQ / Math.max(totalQuestions, 1)) * 85)

  // Auto-save to localStorage every 30 seconds
  useEffect(() => {
    const key = `bizready-draft-${tenantSlug}`
    const saved = localStorage.getItem(key)
    if (saved) {
      try {
        const { bizInfo: b, responses: r, step: s } = JSON.parse(saved)
        if (b) setBizInfo(b)
        if (r) setResponses(r)
        if (s) setStep(s)
      } catch {}
    }
  }, [tenantSlug])

  const autosave = useCallback(() => {
    const key = `bizready-draft-${tenantSlug}`
    localStorage.setItem(key, JSON.stringify({ bizInfo, responses, step }))
    setSavedAt(new Date().toLocaleTimeString())
  }, [bizInfo, responses, step, tenantSlug])

  useEffect(() => {
    const timer = setInterval(autosave, 30000)
    return () => clearInterval(timer)
  }, [autosave])

  // Current section being answered
  const activeSection = step > 0 && step <= scoredSections.length
    ? scoredSections[step - 1]
    : null

  const activeQuestions: Question[] = activeSection?.questions || []
  const activeQuestion: Question | null = activeQuestions[currentQ] || null

  // ── NAVIGATION ──────────────────────────────────────────
  function nextQuestion() {
    if (currentQ < activeQuestions.length - 1) {
      setCurrentQ(currentQ + 1)
    } else {
      // Move to next section
      autosave()
      if (step < scoredSections.length) {
        setStep(step + 1)
        setCurrentQ(0)
      } else {
        handleSubmit()
      }
    }
  }

  function prevQuestion() {
    if (currentQ > 0) {
      setCurrentQ(currentQ - 1)
    } else if (step > 0) {
      setStep(step - 1)
      const prevSection = scoredSections[step - 2]
      setCurrentQ(prevSection ? prevSection.questions.length - 1 : 0)
    }
  }

  // ── ANSWER SELECTION ─────────────────────────────────────
  function selectAnswer(question: Question, optionText: string, score: number) {
    setResponses(prev => ({
      ...prev,
      [question._id]: {
        questionId:     question._id,
        questionText:   question.text,
        selectedOption: optionText,
        score,
      },
    }))
    // Auto-advance after 400ms for satisfying UX
    setTimeout(nextQuestion, 400)
  }

  // ── BUSINESS INFO VALIDATION ─────────────────────────────
  function validateBizInfo(): boolean {
    const errs: Record<string, string> = {}
    if (!bizInfo.name?.trim())    errs.name    = 'Business name is required'
    if (!bizInfo.ceoName?.trim()) errs.ceoName = 'CEO name is required'
    if (!bizInfo.email?.includes('@')) errs.email = 'Valid email is required'
    if (!bizInfo.sector)          errs.sector  = 'Please select a sector'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function startDiagnostic() {
    if (!validateBizInfo()) return
    setStep(1)
    setCurrentQ(0)
  }

  // ── SUBMIT ────────────────────────────────────────────────
  async function handleSubmit() {
    setSubmitting(true)
    try {
      const res = await fetch('/api/diagnostic/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantSlug,
          business: bizInfo,
          responses: Object.values(responses),
          userId,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setResult(data.data)
        localStorage.removeItem(`bizready-draft-${tenantSlug}`)
      } else {
        alert('Submission failed. Please try again.')
      }
    } catch {
      alert('Network error. Please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── RESULT SCREEN ─────────────────────────────────────────
  if (result) {
    return <ResultScreen result={result} theme={theme} bizName={bizInfo.name || 'Your business'} bizEmail={bizInfo.email || ''} />
  }

  // ── SUBMITTING SCREEN ─────────────────────────────────────
  if (submitting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-12 h-12 border-4 border-gray-200 rounded-full animate-spin"
          style={{ borderTopColor: theme.primary }} />
        <p className="text-sm text-gray-500">Calculating your lendability index...</p>
        <p className="text-xs text-gray-400">Scoring across all three capacity levels</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#f4f5f7' }}>

      {/* ── BANK HEADER ────────────────────────────────── */}
      <div style={{ background: theme.primary }} className="px-6 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-md flex items-center justify-center text-xs font-medium text-white"
          style={{ background: 'rgba(255,255,255,0.2)' }}>
          {theme.abbreviation}
        </div>
        <div>
          <p className="text-sm font-medium text-white">{theme.bankName}</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>SME Lendability Diagnostic · Powered by LendIQ</p>
        </div>
      </div>

      {/* ── PROGRESS ───────────────────────────────────── */}
      <div className="px-6 pt-4 max-w-2xl mx-auto">
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-1.5">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${overallProgress}%`, background: theme.primary }} />
        </div>
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2 overflow-x-auto">
            {['Business info', ...scoredSections.map(s => s.name), 'Complete'].map((name, i) => (
              <span key={i} className={clsx(
                'text-[10px] px-2.5 py-1 rounded-full whitespace-nowrap border',
                i === (result ? scoredSections.length + 1 : step)
                  ? 'text-white border-transparent'
                  : i < step ? 'border-transparent'
                  : 'bg-gray-100 text-gray-400 border-gray-100'
              )} style={
                i === step ? { background: theme.primary, borderColor: theme.primary }
                : i < step ? { background: theme.primaryLight, color: theme.primary, borderColor: theme.primary }
                : {}
              }>
                {i < step ? `✓ ${name}` : name}
              </span>
            ))}
          </div>
          {savedAt && <p className="text-[10px] text-gray-400 flex-shrink-0 ml-2">Saved {savedAt}</p>}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 pb-12">

        {/* ── SECTION 0: BUSINESS INFO ────────────────── */}
        {step === 0 && (
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <div className="mb-5">
              <p className="text-xs font-medium uppercase tracking-wide mb-1"
                style={{ color: theme.primary }}>Section 1 — Business information</p>
              <h2 className="text-lg font-medium text-gray-900">Tell us about your business</h2>
              <p className="text-sm text-gray-500 mt-1">This helps us personalise your diagnostic report and connect you with the right bank relationship manager.</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="col-span-2">
                <Input label="Business name" value={bizInfo.name || ''} error={errors.name}
                  onChange={e => setBizInfo(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Rickma Fishing Company Ltd" />
              </div>
              <Input label="CEO / Owner name" value={bizInfo.ceoName || ''} error={errors.ceoName}
                onChange={e => setBizInfo(p => ({ ...p, ceoName: e.target.value }))}
                placeholder="Full name" />
              <Input label="Email address" type="email" value={bizInfo.email || ''} error={errors.email}
                onChange={e => setBizInfo(p => ({ ...p, email: e.target.value }))}
                placeholder="Results sent here" />
              <Input label="Phone number" type="tel" value={bizInfo.phone || ''}
                onChange={e => setBizInfo(p => ({ ...p, phone: e.target.value }))}
                placeholder="+232 XX XXX XXXX" />
              <Input label="Location / City" value={bizInfo.location || ''}
                onChange={e => setBizInfo(p => ({ ...p, location: e.target.value }))}
                placeholder="e.g. Freetown" />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <Select label="Sector" value={bizInfo.sector || ''} error={errors.sector}
                onChange={e => setBizInfo(p => ({ ...p, sector: e.target.value }))}
                options={[{ value: '', label: 'Select sector...' }, ...SECTORS.map(s => ({ value: s, label: s }))]} />
              <Select label="Years operating" value={bizInfo.yearsOperating || ''}
                onChange={e => setBizInfo(p => ({ ...p, yearsOperating: e.target.value }))}
                options={[
                  { value: '', label: 'Select...' },
                  { value: '<1', label: 'Less than 1 year' },
                  { value: '1-3', label: '1 – 3 years' },
                  { value: '4-7', label: '4 – 7 years' },
                  { value: '8-15', label: '8 – 15 years' },
                  { value: '15+', label: 'More than 15 years' },
                ]} />
              <Select label="Number of employees" value={bizInfo.employeeCount || ''}
                onChange={e => setBizInfo(p => ({ ...p, employeeCount: e.target.value }))}
                options={[
                  { value: '', label: 'Select...' },
                  { value: '1-5', label: '1 – 5 employees' },
                  { value: '6-10', label: '6 – 10 employees' },
                  { value: '11-25', label: '11 – 25 employees' },
                  { value: '26-50', label: '26 – 50 employees' },
                  { value: '50+', label: 'More than 50 employees' },
                ]} />
              <Select label="Annual revenue (SLL Millions)" value={bizInfo.annualRevenue || ''}
                onChange={e => setBizInfo(p => ({ ...p, annualRevenue: e.target.value }))}
                options={[
                  { value: '', label: 'Select range...' },
                  { value: '<50m', label: 'Below SLL 50 million' },
                  { value: '50-200m', label: 'SLL 50 – 200 million' },
                  { value: '200-500m', label: 'SLL 200 – 500 million' },
                  { value: '500m-1b', label: 'SLL 500m – 1 billion' },
                  { value: '1b+', label: 'Above SLL 1 billion' },
                ]} />
              <div className="col-span-2">
                <Select label="Primary purpose of the loan" value={bizInfo.loanPurpose || ''}
                  onChange={e => setBizInfo(p => ({ ...p, loanPurpose: e.target.value }))}
                  options={[
                    { value: '', label: 'Select purpose...' },
                    { value: 'working-capital', label: 'Working capital / cash flow' },
                    { value: 'equipment', label: 'Equipment / machinery purchase' },
                    { value: 'expansion', label: 'Business expansion / new location' },
                    { value: 'stock', label: 'Stock / inventory purchase' },
                    { value: 'technology', label: 'Technology / IT investment' },
                    { value: 'staff', label: 'Staff recruitment and training' },
                    { value: 'other', label: 'Other' },
                  ]} />
              </div>
            </div>

            <div className="flex items-center justify-between mt-6">
              <p className="text-xs text-gray-400">
                Your results are confidential and sent only to your bank relationship manager.
              </p>
              <Button variant="primary" size="lg" onClick={startDiagnostic}
                style={{ background: theme.primary, borderColor: theme.primary }}>
                Start diagnostic →
              </Button>
            </div>
          </div>
        )}

        {/* ── SECTION 1-N: QUESTIONS ──────────────────── */}
        {step > 0 && activeSection && activeQuestion && (
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <div className="mb-5">
              <p className="text-xs font-medium uppercase tracking-wide mb-1"
                style={{ color: theme.primary }}>
                Section {step + 1} — {activeSection.name}
              </p>
              <p className="text-xs text-gray-400 mb-3">{activeSection.description}</p>

              {/* Question progress within section */}
              <div className="flex gap-1 mb-4">
                {activeQuestions.map((_, i) => (
                  <div key={i} className={clsx('h-1 flex-1 rounded-full transition-all duration-300',
                    i < currentQ ? 'opacity-100' : i === currentQ ? 'opacity-100' : 'opacity-30'
                  )} style={{ background: i <= currentQ ? theme.primary : '#E5E7EB' }} />
                ))}
              </div>

              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-gray-400">
                  Question {currentQ + 1} of {activeQuestions.length}
                </span>
                <span className="text-[10px] text-gray-400">
                  {activeSection.weight > 0 ? `${Math.round(activeSection.weight * 100)}% of final score` : ''}
                </span>
              </div>

              <h2 className="text-base font-medium text-gray-900 leading-relaxed">
                {activeQuestion.text}
              </h2>
              {activeQuestion.hint && (
                <p className="text-xs text-gray-400 mt-1">{activeQuestion.hint}</p>
              )}
            </div>

            {/* ── ANSWER OPTIONS ──────────────────────── */}
            <div className="flex flex-col gap-2.5">
              {activeQuestion.options.map((opt, i) => {
                const isSelected = responses[activeQuestion._id]?.selectedOption === opt.text
                return (
                  <button
                    key={i}
                    onClick={() => selectAnswer(activeQuestion, opt.text, opt.score)}
                    className={clsx(
                      'w-full text-left px-4 py-3.5 rounded-lg border transition-all duration-150',
                      'flex items-start gap-3 group',
                      isSelected
                        ? 'border-2'
                        : 'border border-gray-200 hover:border-gray-300 bg-white'
                    )}
                    style={isSelected ? {
                      background: theme.primaryLight,
                      borderColor: theme.primary,
                    } : {}}
                  >
                    <div className={clsx(
                      'w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all',
                      isSelected ? '' : 'border-gray-300 group-hover:border-gray-400'
                    )} style={isSelected ? { borderColor: theme.primary, background: theme.primary } : {}}>
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <span className={clsx(
                      'text-sm leading-relaxed',
                      isSelected ? 'font-medium' : 'text-gray-700'
                    )} style={isSelected ? { color: theme.primaryDark } : {}}>
                      {opt.text}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* ── NAV BUTTONS ─────────────────────────── */}
            <div className="flex items-center justify-between mt-6">
              <Button variant="ghost" size="sm" onClick={prevQuestion}
                disabled={step === 1 && currentQ === 0}>
                ← Back
              </Button>
              <div className="flex flex-col items-center gap-1">
                {responses[activeQuestion._id] && (
                  <Button size="sm" onClick={nextQuestion}
                    style={{ background: theme.primary, borderColor: theme.primary, color: 'white' }}>
                    {step === scoredSections.length && currentQ === activeQuestions.length - 1
                      ? 'Submit diagnostic →'
                      : 'Next →'
                    }
                  </Button>
                )}
                <p className="text-[10px] text-gray-400">Progress saved automatically</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── RESULT SCREEN ─────────────────────────────────────────
function ResultScreen({ result, theme, bizName, bizEmail }: {
  result: SubmitResult; theme: BankTheme; bizName: string; bizEmail: string
}) {
  const color = result.lendabilityIndex >= 80 ? '#0F6E56'
    : result.lendabilityIndex >= 60 ? '#BA7517' : '#A32D2D'
  const bg = result.lendabilityIndex >= 80 ? '#E1F5EE'
    : result.lendabilityIndex >= 60 ? '#FAEEDA' : '#FCEBEB'
  const label = result.lendabilityIndex >= 80 ? 'Investment Ready'
    : result.lendabilityIndex >= 60 ? 'Conditionally Lendable' : 'High Risk'

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
          <div style={{ background: theme.primary }} className="px-6 py-5 text-center">
            <p className="text-xs text-white/70 mb-2 uppercase tracking-wide">Lendability Index — {result.period}</p>
            <p className="text-6xl font-medium text-white">{result.lendabilityIndex}%</p>
            <p className="text-lg font-medium mt-2" style={{ color: bg }}>{label}</p>
            <p className="text-xs text-white/60 mt-1">{bizName}</p>
          </div>
          <div className="px-6 py-4 bg-gray-50 text-sm text-gray-600 text-center">
            Your results and Technical Assistance recommendations have been sent to <strong>{bizEmail}</strong>. A bank relationship manager will contact you within 3 business days.
          </div>
        </div>

        {/* Capacity breakdown */}
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <p className="text-sm font-medium text-gray-900 mb-4">Your capacity breakdown</p>
          {[
            { label: 'Strategic capacity',   value: result.strategic,   weight: '30%', color: '#0F6E56' },
            { label: 'Operational capacity', value: result.operational, weight: '45%', color: '#185FA5' },
            { label: 'Support capacity',     value: result.support,     weight: '25%', color: '#BA7517' },
          ].map(row => {
            const c = row.value >= 80 ? '#0F6E56' : row.value >= 60 ? '#BA7517' : '#A32D2D'
            return (
              <div key={row.label} className="flex items-center gap-3 mb-3 last:mb-0">
                <span className="text-xs text-gray-500 w-40 flex-shrink-0">{row.label}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-2 rounded-full transition-all duration-700"
                    style={{ width: `${row.value}%`, background: row.color }} />
                </div>
                <span className="text-sm font-medium w-10 text-right" style={{ color: c }}>{row.value}%</span>
              </div>
            )
          })}
        </div>

        {/* Projected score */}
        <div className="bg-gray-900 rounded-xl px-6 py-5 text-center">
          <p className="text-xs text-gray-400 mb-1">Projected score after completing all TA programmes</p>
          <p className="text-3xl font-medium text-green-400">{result.projectedScore}% — Investment Ready</p>
        </div>

        {/* CTA */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 text-center">
          <p className="text-sm text-gray-600 mb-4">Log in to your SME dashboard to track your progress across all diagnostic periods and monitor your TA programme.</p>
          <a href="/sign-up" className="inline-block px-6 py-3 rounded-lg text-sm font-medium text-white"
            style={{ background: theme.primary }}>
            Create my dashboard account →
          </a>
        </div>
      </div>
    </div>
  )
}
