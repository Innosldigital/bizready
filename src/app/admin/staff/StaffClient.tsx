'use client'
// src/app/admin/staff/StaffClient.tsx

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  ASSIGNABLE_INNOSL_ROLES,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  ROLE_COLORS,
} from '@/lib/roles'

type SME = { _id: string; name: string; sector: string; latestScore?: number; latestClassification?: string }
type StaffMember = {
  _id: string
  name: string
  email: string
  role: string
  jobTitle?: string
  isActive: boolean
  isPending: boolean
  assignedSMEs: SME[]
  createdAt: string
}

// ── MODALS ────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const c = ROLE_COLORS[role] ?? ROLE_COLORS.external_viewer
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
      style={{ background: c.bg, color: c.text }}>
      {ROLE_LABELS[role] ?? role}
    </span>
  )
}

function InviteModal({ businesses, onClose, onSaved }: {
  businesses: SME[]
  onClose: () => void
  onSaved: (s: StaffMember) => void
}) {
  const [form, setForm] = useState({ name: '', email: '', role: 'innosl_admin', jobTitle: '' })
  const [assignedSMEs, setAssignedSMEs] = useState<string[]>([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const needsAssignment = ['focal_person', 'external_viewer'].includes(form.role)

  async function submit() {
    setError('')
    if (!form.name.trim() || !form.email.trim()) { setError('Name and email are required'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, assignedSMEs: needsAssignment ? assignedSMEs : [] }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to invite staff'); return }
      onSaved(data.staff)
      onClose()
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-y-auto max-h-[90vh]">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Invite staff member</h2>
          <p className="text-xs text-gray-400 mt-1">They will be matched by email when they sign up.</p>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Full name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="Jane Doe" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Email *</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="jane@innosl.org" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Role *</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                {ASSIGNABLE_INNOSL_ROLES.map(r => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
              <p className="text-[10px] text-gray-400 mt-1">{ROLE_DESCRIPTIONS[form.role]}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Job title</label>
              <input value={form.jobTitle} onChange={e => setForm(f => ({ ...f, jobTitle: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="Programme Officer" />
            </div>
          </div>

          {needsAssignment && (
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-2">
                Assign SMEs ({assignedSMEs.length} selected)
              </label>
              <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto divide-y divide-gray-50">
                {businesses.map(b => (
                  <label key={b._id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox"
                      checked={assignedSMEs.includes(b._id)}
                      onChange={e => setAssignedSMEs(prev =>
                        e.target.checked ? [...prev, b._id] : prev.filter(id => id !== b._id)
                      )}
                      className="rounded text-violet-600" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{b.name}</p>
                      <p className="text-[10px] text-gray-400">{b.sector}</p>
                    </div>
                  </label>
                ))}
                {businesses.length === 0 && (
                  <p className="text-xs text-gray-400 px-3 py-4 text-center">No SMEs available</p>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">Cancel</button>
          <button onClick={submit} disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-violet-700 hover:bg-violet-800 disabled:opacity-50">
            {saving ? 'Inviting…' : 'Send invite'}
          </button>
        </div>
      </div>
    </div>
  )
}

function EditModal({ staff, businesses, onClose, onSaved }: {
  staff: StaffMember
  businesses: SME[]
  onClose: () => void
  onSaved: (s: StaffMember) => void
}) {
  const [role, setRole] = useState(staff.role)
  const [jobTitle, setJobTitle] = useState(staff.jobTitle ?? '')
  const [isActive, setIsActive] = useState(staff.isActive)
  const [assignedSMEs, setAssignedSMEs] = useState<string[]>(staff.assignedSMEs.map(s => s._id))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const needsAssignment = ['focal_person', 'external_viewer'].includes(role)

  async function submit() {
    setError('')
    setSaving(true)
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: staff._id, role, jobTitle,
          isActive, assignedSMEs: needsAssignment ? assignedSMEs : [],
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to save'); return }
      onSaved(data.staff)
      onClose()
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-y-auto max-h-[90vh]">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Edit {staff.name}</h2>
          <p className="text-xs text-gray-400 mt-1">{staff.email}</p>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Role</label>
              <select value={role} onChange={e => setRole(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                {ASSIGNABLE_INNOSL_ROLES.map(r => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Job title</label>
              <input value={jobTitle} onChange={e => setJobTitle(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="Programme Officer" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input id="active-toggle" type="checkbox" checked={isActive}
              onChange={e => setIsActive(e.target.checked)}
              className="rounded text-violet-600" />
            <label htmlFor="active-toggle" className="text-sm text-gray-700">Account active</label>
          </div>

          {needsAssignment && (
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-2">
                Assigned SMEs ({assignedSMEs.length} selected)
              </label>
              <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto divide-y divide-gray-50">
                {businesses.map(b => (
                  <label key={b._id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox"
                      checked={assignedSMEs.includes(b._id)}
                      onChange={e => setAssignedSMEs(prev =>
                        e.target.checked ? [...prev, b._id] : prev.filter(id => id !== b._id)
                      )}
                      className="rounded text-violet-600" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{b.name}</p>
                      <p className="text-[10px] text-gray-400">{b.sector}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">Cancel</button>
          <button onClick={submit} disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-violet-700 hover:bg-violet-800 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── MAIN CLIENT COMPONENT ─────────────────────────────────

export default function StaffClient({
  initialStaff,
  businesses,
}: {
  initialStaff: StaffMember[]
  businesses: SME[]
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [staff, setStaff] = useState(initialStaff)
  const [showInvite, setShowInvite] = useState(false)
  const [editing, setEditing] = useState<StaffMember | null>(null)
  const [filterRole, setFilterRole] = useState('all')
  const [search, setSearch] = useState('')

  function refresh() { startTransition(() => router.refresh()) }

  async function handleDeactivate(member: StaffMember) {
    const action = member.isPending ? 'delete this pending invite' : 'deactivate this account'
    if (!confirm(`Are you sure you want to ${action}?`)) return
    await fetch(`/api/admin/staff?id=${member._id}`, { method: 'DELETE' })
    setStaff(prev => prev.filter(s => s._id !== member._id))
    refresh()
  }

  function handleSaved(updated: StaffMember) {
    setStaff(prev => {
      const idx = prev.findIndex(s => s._id === updated._id)
      if (idx === -1) return [updated, ...prev]
      const next = [...prev]
      next[idx] = updated
      return next
    })
    refresh()
  }

  const visible = staff.filter(s => {
    if (filterRole !== 'all' && s.role !== filterRole) return false
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) &&
        !s.email.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const roleCounts = ASSIGNABLE_INNOSL_ROLES.reduce((acc, r) => {
    acc[r] = staff.filter(s => s.role === r).length
    return acc
  }, {} as Record<string, number>)

  return (
    <>
      {showInvite && (
        <InviteModal
          businesses={businesses}
          onClose={() => setShowInvite(false)}
          onSaved={s => { handleSaved(s); setShowInvite(false) }}
        />
      )}
      {editing && (
        <EditModal
          staff={editing}
          businesses={businesses}
          onClose={() => setEditing(null)}
          onSaved={s => { handleSaved(s); setEditing(null) }}
        />
      )}

      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Staff Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage InnoSL team members and their access levels</p>
        </div>
        <button onClick={() => setShowInvite(true)}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-violet-700 hover:bg-violet-800 transition-colors">
          + Invite staff
        </button>
      </div>

      {/* Role summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {ASSIGNABLE_INNOSL_ROLES.map(r => {
          const c = ROLE_COLORS[r]
          return (
            <button key={r} onClick={() => setFilterRole(filterRole === r ? 'all' : r)}
              className={`text-left p-4 rounded-xl border transition-all ${filterRole === r ? 'ring-2 ring-violet-500' : ''}`}
              style={{ background: c.bg, borderColor: filterRole === r ? '#5B1FA8' : 'transparent' }}>
              <p className="text-lg font-bold" style={{ color: c.text }}>{roleCounts[r] ?? 0}</p>
              <p className="text-xs font-medium mt-0.5" style={{ color: c.text }}>{ROLE_LABELS[r]}</p>
            </button>
          )
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-50 flex items-center gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-500" />
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-500">
            <option value="all">All roles</option>
            {ASSIGNABLE_INNOSL_ROLES.map(r => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Name', 'Role', 'Assigned SMEs', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wide text-gray-400 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map(member => (
                <tr key={member._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">{member.name}</p>
                    <p className="text-[10px] text-gray-400">{member.email}</p>
                    {member.jobTitle && (
                      <p className="text-[10px] text-gray-400 italic">{member.jobTitle}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <RoleBadge role={member.role} />
                  </td>
                  <td className="px-4 py-3">
                    {member.assignedSMEs.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {member.assignedSMEs.slice(0, 3).map(s => (
                          <span key={s._id} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px]">
                            {s.name}
                          </span>
                        ))}
                        {member.assignedSMEs.length > 3 && (
                          <span className="text-[10px] text-gray-400">
                            +{member.assignedSMEs.length - 3} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {member.isPending ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700">
                        Pending signup
                      </span>
                    ) : member.isActive ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-500">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditing(member)}
                        className="text-violet-700 hover:text-violet-900 font-medium text-xs">
                        Edit
                      </button>
                      <button onClick={() => handleDeactivate(member)}
                        className="text-red-500 hover:text-red-700 font-medium text-xs">
                        {member.isPending ? 'Cancel' : 'Deactivate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400">
                    No staff members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
