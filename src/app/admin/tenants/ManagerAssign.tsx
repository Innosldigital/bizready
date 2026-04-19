'use client'
// Inline manager assignment control for the admin tenants table

import { useState } from 'react'

interface Admin { clerkId: string; name: string; email: string }

interface Props {
  tenantId:       string
  currentManager?: { name: string; email: string } | null
  admins:         Admin[]
}

export default function ManagerAssign({ tenantId, currentManager, admins }: Props) {
  const [selected, setSelected]   = useState('')
  const [saving, setSaving]       = useState(false)
  const [manager, setManager]     = useState(currentManager)
  const [showForm, setShowForm]   = useState(false)
  const [error, setError]         = useState('')

  async function save() {
    setSaving(true)
    setError('')
    const res  = await fetch('/api/admin/tenants/assign-manager', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId, managerId: selected || null }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error || 'Failed'); return }
    setManager(data.data)
    setShowForm(false)
    setSelected('')
  }

  if (!showForm) {
    return (
      <div>
        {manager ? (
          <div>
            <p className="text-xs font-medium text-gray-800">{manager.name}</p>
            <p className="text-[10px] text-gray-400">{manager.email}</p>
          </div>
        ) : (
          <span className="text-[10px] text-gray-400">—</span>
        )}
        <button onClick={() => setShowForm(true)} className="text-[10px] text-violet-600 hover:underline mt-0.5 block">
          {manager ? 'Change' : 'Assign'}
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1 min-w-[140px]">
      <select
        value={selected}
        onChange={e => setSelected(e.target.value)}
        className="px-2 py-1 border border-gray-200 rounded text-xs bg-white"
      >
        <option value="">— Remove —</option>
        {admins.map(a => (
          <option key={a.clerkId} value={a.clerkId}>{a.name}</option>
        ))}
      </select>
      {error && <p className="text-[10px] text-red-500">{error}</p>}
      <div className="flex gap-1">
        <button
          onClick={save}
          disabled={saving}
          className="flex-1 px-2 py-1 text-[10px] font-medium text-white rounded bg-violet-700 hover:bg-violet-800 disabled:opacity-50"
        >
          {saving ? '…' : 'Save'}
        </button>
        <button onClick={() => setShowForm(false)} className="px-2 py-1 text-[10px] border border-gray-200 rounded hover:bg-gray-50">
          ✕
        </button>
      </div>
    </div>
  )
}
