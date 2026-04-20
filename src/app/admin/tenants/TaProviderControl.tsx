'use client'
// src/app/admin/tenants/TaProviderControl.tsx

import { useState } from 'react'

export default function TaProviderControl({
  tenantId,
  current,
}: {
  tenantId: string
  current:  'innovation_sl' | 'self'
}) {
  const [value, setValue]   = useState(current)
  const [saving, setSaving] = useState(false)

  async function handleChange(next: 'innovation_sl' | 'self') {
    setSaving(true)
    try {
      await fetch('/api/admin/ta', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'set_ta_provider', tenantId, taProvider: next }),
      })
      setValue(next)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <select
        disabled={saving}
        value={value}
        onChange={e => handleChange(e.target.value as 'innovation_sl' | 'self')}
        className="text-[11px] border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-purple-300 disabled:opacity-50"
      >
        <option value="self">Themselves</option>
        <option value="innovation_sl">Innovation SL</option>
      </select>
      {value === 'innovation_sl' && (
        <span className="text-[10px] text-purple-600 font-medium">InnoSL manages TA</span>
      )}
    </div>
  )
}
