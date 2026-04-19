import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { handleBankSettingsUpdate } from '@/lib/bank/settings-handler'
import { applyRateLimit, getRequestIp } from '@/lib/security/rate-limit'

export const dynamic = 'force-dynamic'

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limited = applyRateLimit(request, {
      namespace: 'bank-settings',
      key: userId,
      limit: 20,
      windowMs: 10 * 60 * 1000,
      message: 'Too many settings updates. Please wait before trying again.',
    })
    if (limited) return limited

    const body = await request.json()
    const ip = getRequestIp(request)

    const result = await handleBankSettingsUpdate({ userId, body, ip })

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[bank/settings] update failed', error)
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}
