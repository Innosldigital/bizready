'use client'
// src/app/bank/questions/BankQuestionsClient.tsx

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

interface Option    { text: string; score: number }
interface Question  { _id: string; sectionId: string; areaId: string; parameterId: string; text: string; hint?: string; type: string; options: Option[]; order: number; isActive: boolean }
interface Section   { _id: string; name: string; capacityLevel: string; areaNumber: number; maxPoints: number; areaId: string }

function QuestionModal({ question, sections, onSave, onClose }: {
  question: Partial<Question>
  sections: Section[]
  onSave: (q: any) => Promise<void>
  onClose: () => void
}) {
  const [sectionId, setSectionId] = useState(question.sectionId ?? sections[0]?._id ?? '')
  const [text, setText]           = useState(question.text ?? '')
  const [hint, setHint]           = useState(question.hint ?? '')
  const [type, setType]           = useState(question.type ?? 'yesno')
  const [options, setOptions]     = useState<Option[]>(question.options ?? [{ text: '', score: 10 }, { text: '', score: 0 }])
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  const selectedSection = sections.find(s => String(s._id) === String(sectionId))

  async function handleSave() {
    if (!text.trim() || !sectionId) { setError('Section and question text are required'); return }
    setSaving(true); setError('')
    try {
      await onSave({
        ...question,
        sectionId,
        areaId:      selectedSection?.areaId ?? '',
        parameterId: question.parameterId ?? '',
        text: text.trim(),
        hint: hint.trim() || undefined,
        type,
        options,
        order: question.order ?? 1,
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">{question._id ? 'Edit Tenant Question' : 'Add Tenant Question'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Capacity Area Section *</label>
            <select value={sectionId} onChange={e => setSectionId(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
              {sections.map(s => <option key={String(s._id)} value={String(s._id)}>{s.areaNumber}. {s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Question Text *</label>
            <textarea value={text} onChange={e => setText(e.target.value)} rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Hint (optional)</label>
            <input value={hint} onChange={e => setHint(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Type</label>
            <select value={type} onChange={e => setType(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
              <option value="yesno">Yes / No</option>
              <option value="mcq">Multiple Choice</option>
              <option value="scale">5-Point Scale</option>
              <option value="text">Open Text</option>
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-700">Options & Scores</label>
              <button onClick={() => setOptions(o => [...o, { text: '', score: 0 }])} className="text-xs text-violet-700 hover:underline">+ Add</button>
            </div>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input value={opt.text} onChange={e => setOptions(o => o.map((x, j) => j === i ? { ...x, text: e.target.value } : x))}
                    placeholder={`Option ${i + 1}`}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-violet-400" />
                  <input type="number" min={0} max={10} step={0.5} value={opt.score}
                    onChange={e => setOptions(o => o.map((x, j) => j === i ? { ...x, score: parseFloat(e.target.value) || 0 } : x))}
                    className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-violet-400" />
                  {options.length > 1 && (
                    <button onClick={() => setOptions(o => o.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-400">✕</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-gray-600 border border-gray-200 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-violet-700 hover:bg-violet-800 disabled:opacity-60">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function BankQuestionsClient({ platformSections, tenantSections, platformQuestions, initialTenantQuestions }: {
  platformSections: Section[]
  tenantSections: Section[]
  platformQuestions: Question[]
  initialTenantQuestions: Question[]
}) {
  const [tenantQuestions, setTenantQuestions] = useState<Question[]>(initialTenantQuestions)
  const [editing, setEditing]                 = useState<Partial<Question> | null>(null)
  const [tab, setTab]                         = useState<'platform'|'tenant'>('platform')
  const [deleting, setDeleting]               = useState<string | null>(null)

  const allSections = [...platformSections, ...tenantSections]

  const saveQuestion = useCallback(async (q: Partial<Question>) => {
    const isNew = !q._id
    const res = await fetch('/api/bank/questions', {
      method: isNew ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(q),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? 'Save failed')
    if (isNew) setTenantQuestions(qs => [...qs, data.question])
    else setTenantQuestions(qs => qs.map(x => x._id === data.question._id ? data.question : x))
  }, [])

  const deleteQuestion = useCallback(async (id: string) => {
    if (!confirm('Delete this question?')) return
    setDeleting(id)
    await fetch(`/api/bank/questions?id=${id}`, { method: 'DELETE' })
    setTenantQuestions(qs => qs.filter(q => q._id !== id))
    setDeleting(null)
  }, [])

  const displayQuestions = tab === 'platform' ? platformQuestions : tenantQuestions
  const displaySections  = tab === 'platform' ? platformSections : (allSections)

  const questionsBySection: Record<string, Question[]> = {}
  for (const q of displayQuestions) {
    const key = String(q.sectionId)
    if (!questionsBySection[key]) questionsBySection[key] = []
    questionsBySection[key].push(q)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {editing && (
        <QuestionModal
          question={editing}
          sections={allSections}
          onSave={saveQuestion}
          onClose={() => setEditing(null)}
        />
      )}

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Question Bank</h1>
          <p className="text-sm text-gray-500 mt-1">View platform questions · Manage your bank-specific questions</p>
        </div>
        {tab === 'tenant' && (
          <button onClick={() => setEditing({ order: tenantQuestions.length + 1 })}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-violet-700 hover:bg-violet-800">
            + Add Question
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {(['platform', 'tenant'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'platform' ? `Platform Questions (${platformQuestions.length})` : `Your Questions (${tenantQuestions.length})`}
          </button>
        ))}
      </div>

      {/* Questions by section */}
      <div className="space-y-4">
        {(tab === 'platform' ? platformSections : platformSections).map(section => {
          const sqs        = questionsBySection[String(section._id)] ?? []
          const levelStyle = LEVEL_BADGE[section.capacityLevel] ?? LEVEL_BADGE.support
          if (tab === 'platform' && sqs.length === 0) return null

          return (
            <details key={String(section._id)} className="group bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden" open={sqs.length > 0}>
              <summary className="px-5 py-4 flex items-center justify-between cursor-pointer list-none hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-gray-100 text-xs font-bold text-gray-500 flex items-center justify-center">{section.areaNumber}</span>
                  <p className="text-sm font-semibold text-gray-800">{section.name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: levelStyle.bg, color: levelStyle.color }}>{levelStyle.label}</span>
                  <span className="text-xs text-gray-400">{sqs.length} questions</span>
                  {tab === 'tenant' && (
                    <button onClick={e => { e.preventDefault(); setEditing({ sectionId: String(section._id), areaId: section.areaId, order: sqs.length + 1 }) }}
                      className="text-xs text-violet-700 font-medium hover:underline px-2 py-0.5 rounded-lg hover:bg-violet-50">+ Add</button>
                  )}
                  <svg className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </summary>

              <div className="border-t border-gray-100">
                {sqs.length === 0 ? (
                  <p className="px-5 py-4 text-xs text-gray-400 text-center">No questions in this section yet.
                    {tab === 'tenant' && <button onClick={() => setEditing({ sectionId: String(section._id), areaId: section.areaId, order: 1 })} className="ml-2 text-violet-700 hover:underline">Add one</button>}
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wide">#</th>
                          <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wide">Question</th>
                          <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wide">Type</th>
                          <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wide">Options</th>
                          {tab === 'tenant' && <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wide">Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {sqs.map(q => {
                          const tb = TYPE_BADGE[q.type] ?? { bg: '#F3F4F6', color: '#6B7280' }
                          return (
                            <tr key={q._id} className="border-b border-gray-50 hover:bg-gray-50">
                              <td className="px-4 py-3 text-gray-400 font-mono">{q.order}</td>
                              <td className="px-4 py-3 max-w-sm">
                                <p className="font-medium text-gray-800">{q.text}</p>
                                {q.hint && <p className="text-[11px] text-gray-400 italic mt-0.5">{q.hint}</p>}
                              </td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase" style={{ background: tb.bg, color: tb.color }}>{q.type}</span>
                              </td>
                              <td className="px-4 py-3 text-gray-500">{q.options?.length ?? 0} options</td>
                              {tab === 'tenant' && (
                                <td className="px-4 py-3">
                                  <div className="flex gap-2">
                                    <button onClick={() => setEditing(q)}
                                      className="px-2.5 py-1 rounded-lg text-[10px] font-semibold border border-violet-200 text-violet-700 hover:bg-violet-50">Edit</button>
                                    <button onClick={() => deleteQuestion(q._id)} disabled={deleting === q._id}
                                      className="px-2.5 py-1 rounded-lg text-[10px] font-semibold border border-red-100 text-red-500 hover:bg-red-50 disabled:opacity-40">
                                      {deleting === q._id ? '…' : 'Del'}
                                    </button>
                                  </div>
                                </td>
                              )}
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
