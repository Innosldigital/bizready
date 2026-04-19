import { NextRequest, NextResponse } from 'next/server'

type RateLimitOptions = {
  limit: number
  windowMs: number
  namespace: string
  key?: string
  message?: string
}

type Bucket = {
  count: number
  resetAt: number
}

declare global {
  var __bizreadyRateLimitStore: Map<string, Bucket> | undefined
}

const store = global.__bizreadyRateLimitStore ?? new Map<string, Bucket>()
global.__bizreadyRateLimitStore = store

export function resetRateLimitStore() {
  store.clear()
}

export function getRequestIp(req: NextRequest | Request) {
  const forwardedFor = req.headers.get('x-forwarded-for')
  if (forwardedFor) return forwardedFor.split(',')[0].trim()

  const realIp = req.headers.get('x-real-ip')
  if (realIp) return realIp.trim()

  return 'unknown'
}

export function applyRateLimit(req: NextRequest | Request, options: RateLimitOptions) {
  const now = Date.now()
  const subject = options.key?.trim() || getRequestIp(req)
  const bucketKey = `${options.namespace}:${subject}`
  const existing = store.get(bucketKey)

  if (!existing || existing.resetAt <= now) {
    store.set(bucketKey, {
      count: 1,
      resetAt: now + options.windowMs,
    })
    return null
  }

  if (existing.count >= options.limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000))
    return NextResponse.json(
      {
        success: false,
        error: options.message || 'Too many requests. Please try again later.',
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfterSeconds),
        },
      },
    )
  }

  existing.count += 1
  store.set(bucketKey, existing)
  return null
}
