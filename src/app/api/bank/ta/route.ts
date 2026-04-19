import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { handleTACreation } from '@/lib/ta/ta-handler'
import { applyRateLimit, getRequestIp } from '@/lib/security/rate-limit'

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.redirect(new URL('/sign-in', request.url))

  const limited = applyRateLimit(request, {
    namespace: 'bank-ta-create',
    key: userId,
    limit: 12,
    windowMs: 10 * 60 * 1000,
    message: 'Too many TA creation attempts. Please wait before trying again.',
  })
  if (limited) return limited

  const formData = await request.formData()
  const businessId = String(formData.get('businessId') ?? '')
  const diagnosticId = String(formData.get('diagnosticId') ?? '')
  const ip = getRequestIp(request)
  const baseUrl = new URL(request.url).origin

  const result = await handleTACreation({ userId, businessId, diagnosticId, ip, baseUrl })

  return NextResponse.redirect(new URL(result.redirect, request.url))
}
