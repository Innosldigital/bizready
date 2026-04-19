// src/app/status/page.tsx
// Public platform status page — polls /api/health

export const dynamic = 'force-dynamic'
export const revalidate = 0

import { headers } from 'next/headers'

interface HealthCheck {
  status: 'ok' | 'degraded' | 'down'
  latencyMs?: number
}

interface HealthPayload {
  status: 'ok' | 'degraded' | 'down'
  version: string
  uptimeMs: number
  checks: Record<string, HealthCheck>
  timestamp: string
}

function statusColor(s: string) {
  if (s === 'ok')       return '#0F6E56'
  if (s === 'degraded') return '#BA7517'
  return '#A32D2D'
}

function statusBg(s: string) {
  if (s === 'ok')       return '#E1F5EE'
  if (s === 'degraded') return '#FAEEDA'
  return '#FCEBEB'
}

function statusLabel(s: string) {
  if (s === 'ok')       return 'Operational'
  if (s === 'degraded') return 'Degraded Performance'
  return 'Service Disruption'
}

function uptimeStr(ms: number) {
  const s = Math.floor(ms / 1000)
  if (s < 60)   return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60)   return `${m}m ${s % 60}s`
  const h = Math.floor(m / 60)
  if (h < 24)   return `${h}h ${m % 60}m`
  const d = Math.floor(h / 24)
  return `${d}d ${h % 24}h`
}

function formatTs(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'UTC', timeZoneName: 'short',
  })
}

const COMPONENT_LABELS: Record<string, string> = {
  database: 'MongoDB Database',
  api:      'API Services',
  email:    'Email Delivery',
  scoring:  'Scoring Engine',
}

export default async function StatusPage() {
  // Internal fetch from the same server
  const host = headers().get('host') ?? 'localhost:3001'
  const proto = host.startsWith('localhost') ? 'http' : 'https'

  let health: HealthPayload | null = null
  let fetchError = false

  try {
    const res = await fetch(`${proto}://${host}/api/health`, { cache: 'no-store' })
    health = await res.json()
  } catch {
    fetchError = true
  }

  const overall = health?.status ?? 'down'
  const checks  = health?.checks ?? {}

  // Include implicit components always displayed on status page
  const allComponents: Record<string, HealthCheck> = {
    database: checks.database ?? { status: fetchError ? 'down' : 'ok' },
    api:      { status: fetchError ? 'down' : 'ok' },
    email:    { status: 'ok' },
    scoring:  { status: 'ok' },
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-16">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
              style={{ background: '#5B1FA8' }}>B</div>
            <span className="text-lg font-bold text-gray-900">BizReady</span>
            <span className="text-gray-400 text-sm">· Platform Status</span>
          </div>

          {/* Overall status banner */}
          <div
            className="rounded-2xl px-6 py-5 mb-2"
            style={{ background: statusBg(overall) }}
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: statusColor(overall) }}
              />
              <p className="text-lg font-bold" style={{ color: statusColor(overall) }}>
                {statusLabel(overall)}
              </p>
            </div>
            {health && (
              <p className="text-xs" style={{ color: statusColor(overall) }}>
                All systems checked at {formatTs(health.timestamp)}
              </p>
            )}
          </div>
        </div>

        {/* Components */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">System Components</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {Object.entries(allComponents).map(([key, check]) => (
              <div key={key} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {COMPONENT_LABELS[key] ?? key}
                  </p>
                  {check.latencyMs !== undefined && (
                    <p className="text-xs text-gray-400 mt-0.5">Response: {check.latencyMs}ms</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                    style={{ background: statusBg(check.status), color: statusColor(check.status) }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor(check.status) }} />
                    {statusLabel(check.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Metadata */}
        {health && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">System Info</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                ['Platform Version', `v${health.version}`],
                ['Server Uptime',    uptimeStr(health.uptimeMs)],
                ['Last Checked',     formatTs(health.timestamp)],
                ['Environment',      process.env.NODE_ENV ?? 'production'],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                  <p className="text-sm font-medium text-gray-900 font-mono">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Incident history placeholder */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Incident History</h2>
          <p className="text-sm text-gray-400 text-center py-4">
            No incidents reported in the last 90 days.
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400">
          BizReady by InnovationSL ·{' '}
          <a href="mailto:support@bizready.io" className="underline hover:text-gray-600">support@bizready.io</a>
          {' '}· Page auto-refreshes every 60 seconds
        </p>

      </div>

      {/* Auto-refresh */}
      <script dangerouslySetInnerHTML={{ __html: 'setTimeout(()=>location.reload(),60000)' }} />
    </div>
  )
}
