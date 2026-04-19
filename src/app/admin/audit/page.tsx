import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db'
import { AuditLog, User } from '@/models'

type AuditSearchParams = {
  page?: string
  action?: string
  status?: string
}

function formatDate(value: Date | string) {
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function previewDetails(details: unknown) {
  if (!details || typeof details !== 'object') return '-'

  const serialized = JSON.stringify(details)
  if (!serialized) return '-'

  return serialized.length > 120 ? `${serialized.slice(0, 117)}...` : serialized
}

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: AuditSearchParams
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  await connectDB()

  const user = await User.findOne({ clerkId: userId }).lean() as any
  if (!user || user.role !== 'platform_admin') redirect('/dashboard')

  const page = Math.max(1, Number(searchParams?.page ?? 1))
  const limit = 25
  const action = (searchParams?.action ?? '').trim()
  const status = (searchParams?.status ?? '').trim()

  const query: Record<string, unknown> = {}
  if (action) query.action = action
  if (status) query.status = status

  const [entries, total, actionOptions] = await Promise.all([
    AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('tenantId')
      .lean()
      .exec() as unknown as any[],
    AuditLog.countDocuments(query),
    AuditLog.distinct('action'),
  ])

  const pages = Math.max(1, Math.ceil(total / limit))
  const selectedActionLabel = action || 'All actions'
  const selectedStatusLabel = status || 'All statuses'

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Audit Log</h1>
          <p className="text-sm text-gray-500">
            {total.toLocaleString()} tracked events across settings, onboarding, TA, and question bank actions.
          </p>
        </div>

        <form className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="text-xs text-gray-500">
            Action
            <select
              name="action"
              defaultValue={action}
              className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
            >
              <option value="">All actions</option>
              {actionOptions
                .filter((option): option is string => typeof option === 'string' && option.length > 0)
                .sort((left, right) => left.localeCompare(right))
                .map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
            </select>
          </label>

          <label className="text-xs text-gray-500">
            Status
            <select
              name="status"
              defaultValue={status}
              className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
            >
              <option value="">All statuses</option>
              <option value="success">Success</option>
              <option value="rejected">Rejected</option>
              <option value="failed">Failed</option>
            </select>
          </label>

          <button
            type="submit"
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Apply
          </button>

          {(action || status) && (
            <Link
              href="/admin/audit"
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Clear
            </Link>
          )}
        </form>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-600">{selectedActionLabel}</span>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-600">{selectedStatusLabel}</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Tenant</th>
              <th className="px-4 py-3">Resource</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">IP</th>
              <th className="px-4 py-3">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {entries.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-400">
                  No audit events found for the selected filters.
                </td>
              </tr>
            ) : (
              entries.map((entry: any) => {
                const tenant = entry.tenantId as any
                const statusTone =
                  entry.status === 'failed'
                    ? 'bg-red-50 text-red-700'
                    : entry.status === 'rejected'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-emerald-50 text-emerald-700'

                return (
                  <tr key={String(entry._id)} className="align-top hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDate(entry.createdAt)}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{entry.action}</p>
                      <p className="text-xs text-gray-400">{entry.actorRole || 'Unknown role'}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      <p>{entry.actorClerkId || '-'}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      <p>{tenant?.name || '-'}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      <p className="font-medium text-gray-700">{entry.resourceType}</p>
                      <p className="text-gray-400">{entry.resourceId || '-'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${statusTone}`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{entry.ipAddress || '-'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      <code className="rounded bg-gray-100 px-2 py-1 text-[11px] text-gray-600">
                        {previewDetails(entry.details)}
                      </code>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: pages }, (_, index) => index + 1).map((pageNumber) => {
            const params = new URLSearchParams()
            params.set('page', String(pageNumber))
            if (action) params.set('action', action)
            if (status) params.set('status', status)

            return (
              <Link
                key={pageNumber}
                href={`/admin/audit?${params.toString()}`}
                className={`rounded-lg px-3 py-1.5 text-xs ${
                  pageNumber === page
                    ? 'bg-gray-900 text-white'
                    : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {pageNumber}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
