'use client'
// src/app/admin/tenants/DeleteTenantButton.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteTenantButton({
  tenantId,
  tenantName,
  diagnosticCount,
}: {
  tenantId: string
  tenantName: string
  diagnosticCount: number
}) {
  const [open, setOpen]       = useState(false)
  const [confirm, setConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError]     = useState('')
  const router = useRouter()

  async function handleDelete() {
    if (confirm !== tenantName) return
    setDeleting(true)
    setError('')
    try {
      const res  = await fetch(`/api/admin/tenants/${tenantId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Delete failed.'); setDeleting(false); return }
      setOpen(false)
      router.refresh()
    } catch {
      setError('Unable to delete tenant right now.')
      setDeleting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); setConfirm(''); setError('') }}
        className="text-xs font-medium text-red-500 hover:text-red-700 hover:underline whitespace-nowrap"
      >
        Delete
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">

            {/* Header */}
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Delete Tenant</h2>
                <p className="text-xs text-gray-500 mt-0.5">This action is permanent and cannot be undone.</p>
              </div>
            </div>

            {/* What will be deleted */}
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 mb-5 space-y-1">
              <p className="text-xs font-semibold text-red-800 mb-2">The following will be permanently deleted:</p>
              {[
                `Tenant: ${tenantName}`,
                `All ${diagnosticCount} diagnostic submission${diagnosticCount !== 1 ? 's' : ''}`,
                'All SME business profiles',
                'All TA programmes',
                'All bank staff & admin user accounts',
                'All API keys',
              ].map(item => (
                <div key={item} className="flex items-center gap-2 text-xs text-red-700">
                  <span className="text-red-400">✕</span> {item}
                </div>
              ))}
            </div>

            {/* Confirmation input */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Type <span className="font-mono font-bold text-gray-900">{tenantName}</span> to confirm
              </label>
              <input
                type="text"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder={tenantName}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-xs text-red-600 mb-3">{error}</p>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setOpen(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={confirm !== tenantName || deleting}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-40"
                style={{ background: '#DC2626' }}
              >
                {deleting ? 'Deleting…' : 'Delete Everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
