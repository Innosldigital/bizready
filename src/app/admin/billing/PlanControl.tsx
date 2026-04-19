'use client'
// src/app/admin/billing/PlanControl.tsx
// Inline plan-override dropdown for admin billing table

import { useState } from 'react'

const PLANS = ['starter', 'growth', 'enterprise', 'owner'] as const
type Plan = typeof PLANS[number]

const COLORS: Record<Plan, string> = {
  starter:    '#6B7280',
  growth:     '#185FA5',
  enterprise: '#7C3AED',
  owner:      '#BA7517',
}

export default function PlanControl({ tenantId, currentPlan, isActive }: {
  tenantId: string
  currentPlan: Plan
  isActive: boolean
}) {
  const [plan, setPlan]       = useState<Plan>(currentPlan)
  const [active, setActive]   = useState(isActive)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  async function changePlan(newPlan: Plan) {
    setSaving(true)
    setError('')
    const res  = await fetch('/api/admin/tenants/plan', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId, plan: newPlan }),
    })
    const data = await res.json()
    if (res.ok) {
      setPlan(data.plan)
    } else {
      setError(data.error ?? 'Failed')
    }
    setSaving(false)
  }

  async function toggleActive() {
    setSaving(true)
    setError('')
    const res  = await fetch('/api/admin/tenants/plan', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId, plan, isActive: !active }),
    })
    const data = await res.json()
    if (res.ok) {
      setActive(data.isActive)
    } else {
      setError(data.error ?? 'Failed')
    }
    setSaving(false)
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <select
        value={plan}
        disabled={saving}
        onChange={e => changePlan(e.target.value as Plan)}
        className="text-xs px-2 py-1 rounded-full font-medium text-white border-0 cursor-pointer disabled:opacity-60"
        style={{ background: COLORS[plan] }}
      >
        {PLANS.map(p => (
          <option key={p} value={p} style={{ background: '#fff', color: '#111' }}>
            {p}
          </option>
        ))}
      </select>
      <button
        onClick={toggleActive}
        disabled={saving}
        className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors disabled:opacity-50 ${
          active ? 'bg-green-50 text-green-700 hover:bg-red-50 hover:text-red-600' : 'bg-red-50 text-red-700 hover:bg-green-50 hover:text-green-600'
        }`}
      >
        {active ? 'Active' : 'Inactive'}
      </button>
      {error && <span className="text-[10px] text-red-500">{error}</span>}
    </div>
  )
}
