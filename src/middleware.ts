import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/onboarding(.*)',
  '/dashboard(.*)',
  '/diagnostic/(.*)',
  '/api/onboarding(.*)',
  '/api/diagnostic/(.*)',
  '/api/webhook/(.*)',
  '/api/debug/(.*)',
])

const isPlatformAdminRoute = createRouteMatcher(['/admin(.*)'])
const isBankRoute          = createRouteMatcher(['/bank(.*)'])
const isSMERoute           = createRouteMatcher(['/sme(.*)'])

export default clerkMiddleware(async (auth, req: NextRequest) => {
  if (isPublicRoute(req)) return NextResponse.next()

  const { userId, sessionClaims } = await auth()

  if (!userId) {
    const signInUrl = new URL('/sign-in', req.url)
    signInUrl.searchParams.set('redirect_url', req.url)
    return NextResponse.redirect(signInUrl)
  }

  const metadata = sessionClaims?.metadata as Record<string, string> | undefined
  const role = metadata?.role || ''

  if (!role && (isPlatformAdminRoute(req) || isBankRoute(req) || isSMERoute(req))) {
    return NextResponse.redirect(new URL('/onboarding', req.url))
  }

  if (isPlatformAdminRoute(req) && role !== 'platform_admin') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
  if (isBankRoute(req) && !['bank_admin', 'bank_staff'].includes(role)) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
  if (isSMERoute(req) && role !== 'sme') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  const response = NextResponse.next()
  if (role) response.headers.set('x-user-role', role)
  return response
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}