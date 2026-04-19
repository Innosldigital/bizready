'use client'
// src/app/admin/questions/QuestionsClient.tsx
// Interactive question bank editor for platform admin

import { useState, useCallback } from 'react'

const LEVEL_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  strategic: { bg: '#E1F5EE', color: '#0F6E56', label: 'Strategic' },
  process:   { bg: '#EFF6FF', color: '#185FA5', label: 'Process' },
  support:   { bg: '#FAEEDA', color: '#BA7517', label: 'Support' },
}

const TYPE_BADGE: Record<string, { bg: string; color: string }> = {
  mcq:   { bg: '#EDE9FE', color: '#5B21B6' },
  scale: { bg: '#FEF3C7', color: '#92400E' },
  yesno: { bg: '#DCFCE7', color: '#166534' },
  text:  { bg: '#F0F9FF', color: '#0369A1' },
}

interface Option { text: string; score: number }
interface Question {
  _id: string; sectionId: string; areaId: string; parameterId: string
  text: string; hint?: string; type: 'mcq'|'scale'|'yesno'|'text'
  options: Option[]; order: number; isRequired: boolean; isActive: boolean
}
interface Section {
  _id: string; name: string; capacityLevel: string; areaNumber: number
  maxPoints: number; weight: number; areaId: string
}

function EditModal({ question, onSave, onClose }: {
  question: Partial<Question> & { sectionId?: string; areaId?: string; parameterId?: string }
  onSave: (q: any) => Promise<void>
  onClose: () => void
}) {
  const [text, setText]           = useState(question.text ?? '')
  const [hint, setHint]           = useState(question.hint ?? '')
  const [type, setType]           = useState<string>(question.type ?? 'yesno')
  const [options, setOptions]     = useState<Option[]>(question.options ?? [{ text: '', score: 10 }])
  const [isActive, setIsActive]   = useState(question.isActive ?? true)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  function addOption() {
    setOptions(o => [...o, { text: '', score: 0 }])
  }
  function removeOption(i: number) {
    setOptions(o => o.filter((_, idx) => idx !== i))
  }
  function updateOption(i: number, field: 'text'|'score', val: string|number) {
    setOptions(o => o.map((opt, idx) => idx === i ? { ...opt, [field]: val } : opt))
  }

  async function handleSave() {
    if (!text.trim()) { setError('Question text is required'); return }
    if (options.length === 0) { setError('At least one option is required'); return }
    setSaving(true); setError('')
    try {
      await onSave({
        ...question,
        text: text.trim(),
        hint: hint.trim() || undefined,
        type,
        options,
        isActive,
      })
      onClose()
    } catch (e: any) {
      setError(e.message ?? 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">{question._id ? 'Edit Question' : 'Add Question'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Question Text *</label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Hint / Guidance (optional)</label>
            <input
              value={hint}
              onChange={e => setHint(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="Guidance shown to SME during assessment…"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-700 block mb-1">Question Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="yesno">Yes / No</option>
                <option value="mcq">Multiple Choice (MCQ)</option>
                <option value="scale">5-Point Scale</option>
                <option value="text">Open Text</option>
              </select>
            </div>
            <div className="flex items-end gap-2 pb-0.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => setIsActive(a => !a)}
                  className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${isActive ? 'bg-emerald-500' : 'bg-gray-200'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow mt-0.5 transition-all ${isActive ? 'ml-5' : 'ml-0.5'}`} />
                </div>
                <span className="text-xs text-gray-600">{isActive ? 'Active' : 'Inactive'}</span>
              </label>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-700">Answer Options & Scores</label>
              <button onClick={addOption} className="text-xs text-violet-700 hover:underline font-medium">+ Add option</button>
            </div>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    value={opt.text}
                    onChange={e => updateOption(i, 'text', e.target.value)}
                    placeholder={`Option ${i + 1}`}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-xs text-gray-400">Score:</span>
                    <input
                      type="number" min={0} max={10} step={0.5}
                      value={opt.score}
                      onChange={e => updateOption(i, 'score', parseFloat(e.target.value) || 0)}
                      className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                    <span className="text-xs text-gray-400">/10</span>
                  </div>
                  {options.length > 1 && (
                    <button onClick={() => removeOption(i)} className="text-gray-300 hover:text-red-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-gray-600 border border-gray-200 hover:bg-gray-50">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-violet-700 hover:bg-violet-800 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save Question'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function QuestionsClient({
  initialSections,
  initialQuestions,
}: {
  initialSections: Section[]
  initialQuestions: Question[]
}) {
  const [sections]                        = useState<Section[]>(initialSections)
  const [questions, setQuestions]         = useState<Question[]>(initialQuestions)
  const [editingQ, setEditingQ]           = useState<Partial<Question> | null>(null)
  const [addingTo, setAddingTo]           = useState<Section | null>(null)
  const [deleting, setDeleting]           = useState<string | null>(null)

  const questionsBySection: Record<string, Question[]> = {}
  for (const q of questions) {
    const key = String(q.sectionId)
    if (!questionsBySection[key]) questionsBySection[key] = []
    questionsBySection[key].push(q)
  }

  const saveQuestion = useCallback(async (q: Partial<Question>) => {
    const isNew = !q._id
    const res = await fetch('/api/admin/questions', {
      method: isNew ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(q),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? 'Save failed')
    if (isNew) {
      setQuestions(qs => [...qs, data.question])
    } else {
      setQuestions(qs => qs.map(x => x._id === data.question._id ? data.question : x))
    }
  }, [])

  const deleteQuestion = useCallback(async (id: string) => {
    if (!confirm('Delete this question? This cannot be undone.')) return
    setDeleting(id)
    const res = await fetch(`/api/admin/questions?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      setQuestions(qs => qs.filter(q => q._id !== id))
    }
    setDeleting(null)
  }, [])

  const toggleActive = useCallback(async (q: Question) => {
    const res = await fetch('/api/admin/questions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: q._id, isActive: !q.isActive }),
    })
    const data = await res.json()
    if (res.ok) {
      setQuestions(qs => qs.map(x => x._id === data.question._id ? data.question : x))
    }
  }, [])

  const totalActive = questions.filter(q => q.isActive).length

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Modal */}
      {(editingQ || addingTo) && (
        <EditModal
          question={editingQ ?? {
            sectionId:   String(addingTo!._id),
            areaId:      addingTo!.areaId,
            parameterId: '',
            order:       (questionsBySection[String(addingTo!._id)]?.length ?? 0) + 1,
          }}
          onSave={saveQuestion}
          onClose={() => { setEditingQ(null); setAddingTo(null) }}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Question Bank</h1>
          <p className="text-sm text-gray-500 mt-1">Platform-wide diagnostic questions (all SMEs)</p>
        </div>
        <div className="flex items-center gap-2">
          <a href="/api/question-bank/export"
            className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50">
            Export CSV
          </a>
          <a href="/admin/questions/import"
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-violet-700 hover:bg-violet-800">
            Import CSV
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Capacity Areas', value: sections.length },
          { label: 'Total Questions', value: questions.length },
          { label: 'Active Questions', value: totalActive, color: 'text-emerald-700' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color ?? 'text-gray-900'}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {sections.map(section => {
          const sqs        = questionsBySection[String(section._id)] ?? []
          const levelStyle = LEVEL_BADGE[section.capacityLevel] ?? LEVEL_BADGE.support

          return (
            <details key={String(section._id)} className="group bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <summary className="px-5 py-4 flex items-center justify-between cursor-pointer list-none hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-gray-100 text-xs font-bold text-gray-500 flex items-center justify-center flex-shrink-0">
                    {section.areaNumber}
                  </span>
                  <p className="text-sm font-semibold text-gray-800">{section.name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                    style={{ background: levelStyle.bg, color: levelStyle.color }}>
                    {levelStyle.label}
                  </span>
                  <span className="text-xs text-gray-400">{sqs.filter(q => q.isActive).length}/{sqs.length} active</span>
                  <span className="text-xs text-gray-400">Max {section.maxPoints} pts</span>
                  <button
                    onClick={e => { e.preventDefault(); setAddingTo(section) }}
                    className="text-xs text-violet-700 font-medium hover:underline px-2 py-0.5 rounded-lg hover:bg-violet-50"
                  >
                    + Add
                  </button>
                  <svg className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </summary>

              <div className="border-t border-gray-100">
                {sqs.length === 0 ? (
                  <div className="px-5 py-6 text-center">
                    <p className="text-xs text-gray-400 mb-2">No questions yet.</p>
                    <button onClick={() => setAddingTo(section)}
                      className="text-xs text-violet-700 font-medium hover:underline">+ Add first question</button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="px-4 py-2.5 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wide w-10">#</th>
                          <th className="px-4 py-2.5 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wide">Question</th>
                          <th className="px-4 py-2.5 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wide">Type</th>
                          <th className="px-4 py-2.5 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wide">Options</th>
                          <th className="px-4 py-2.5 text-center text-[10px] font-medium text-gray-400 uppercase tracking-wide">Active</th>
                          <th className="px-4 py-2.5 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wide">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sqs.map(q => {
                          const tb = TYPE_BADGE[q.type] ?? { bg: '#F3F4F6', color: '#6B7280' }
                          return (
                            <tr key={q._id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${!q.isActive ? 'opacity-50' : ''}`}>
                              <td className="px-4 py-3 text-gray-400 font-mono">{q.order}</td>
                              <td className="px-4 py-3 max-w-sm">
                                <p className="font-medium text-gray-800 leading-snug">{q.text}</p>
                                {q.hint && <p className="text-gray-400 text-[11px] mt-0.5 italic">{q.hint}</p>}
                                {q.parameterId && <p className="text-[10px] text-gray-300 font-mono mt-0.5">{q.parameterId}</p>}
                              </td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase"
                                  style={{ background: tb.bg, color: tb.color }}>{q.type}</span>
                              </td>
                              <td className="px-4 py-3 text-gray-500">
                                {q.options?.length > 0 ? (
                                  <div className="space-y-0.5">
                                    {q.options.slice(0, 3).map((o, i) => (
                                      <div key={i} className="flex items-center gap-1.5">
                                        <span className="w-8 text-right text-gray-300 font-mono">{o.score}</span>
                                        <span className="truncate text-gray-500 max-w-[140px]" title={o.text}>{o.text}</span>
                                      </div>
                                    ))}
                                    {q.options.length > 3 && (
                                      <p className="text-gray-300 text-[10px]">+{q.options.length - 3} more</p>
                                    )}
                                  </div>
                                ) : <span className="text-gray-300">—</span>}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button onClick={() => toggleActive(q)}>
                                  <div className={`w-8 h-4 rounded-full flex items-center cursor-pointer ${q.isActive ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                                    <div className={`w-3 h-3 rounded-full bg-white shadow-sm transition-all mx-0.5 ${q.isActive ? 'translate-x-4' : 'translate-x-0'}`} />
                                  </div>
                                </button>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setEditingQ(q)}
                                    className="px-2.5 py-1 rounded-lg text-[10px] font-semibold border border-violet-200 text-violet-700 hover:bg-violet-50"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => deleteQuestion(q._id)}
                                    disabled={deleting === q._id}
                                    className="px-2.5 py-1 rounded-lg text-[10px] font-semibold border border-red-100 text-red-500 hover:bg-red-50 disabled:opacity-40"
                                  >
                                    {deleting === q._id ? '…' : 'Del'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </details>
          )
        })}
      </div>
    </div>
  )
}
