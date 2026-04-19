// src/app/api/health/route.ts
// Public health check endpoint — used by uptime monitors and the /status page

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import mongoose from 'mongoose'

const startTime = Date.now()

export async function GET() {
  const checks: Record<string, { status: 'ok' | 'degraded' | 'down'; latencyMs?: number }> = {}

  // Database check
  const dbStart = Date.now()
  try {
    await connectDB()
    await mongoose.connection.db?.admin().ping()
    checks.database = { status: 'ok', latencyMs: Date.now() - dbStart }
  } catch {
    checks.database = { status: 'down', latencyMs: Date.now() - dbStart }
  }

  const allOk     = Object.values(checks).every(c => c.status === 'ok')
  const anyDown   = Object.values(checks).some(c => c.status === 'down')
  const overallStatus = anyDown ? 'degraded' : allOk ? 'ok' : 'degraded'

  return NextResponse.json({
    status:   overallStatus,
    version:  process.env.npm_package_version ?? '0.1.0',
    uptimeMs: Date.now() - startTime,
    checks,
    timestamp: new Date().toISOString(),
  }, {
    status: overallStatus === 'ok' ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
    },
  })
}
