import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Hostnames that are native to this platform — anything else is a custom tenant domain
const PLATFORM_HOSTS = new Set([
  'bizready.io',
  'www.bizready.io',
  'localhost',
  '127.0.0.1',
])

function isPlatformHost(hostname: string): boolean {
  // Strip port and match exact + any Vercel preview deployment pattern
  const host = hostname.split(':')[0]
  return PLATFORM_HOSTS.has(host) || host.endsWith('.vercel.app')
}

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/onboarding(.*)',
  '/diagnostic/(.*)',
  '/about(.*)',
  '/contact',
  '/privacy',
  '/terms',
  '/security',
  '/cookies',
  '/api/onboarding(.*)',
  '/api/diagnostic/submit',
  '/api/webhook/(.*)',
  '/api/health',
  '/status',
])

const isPlatformAdminRoute = createRouteMatcher(['/admin(.*)'])
const isBankRoute          = createRouteMatcher(['/bank(.*)'])
const isSMERoute           = createRouteMatcher(['/sme(.*)'])

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // ── Custom domain handling ────────────────────────────────
  // If the request is coming in on a non-platform hostname, rewrite to the
  // /diagnostic/custom-domain handler which will look up the tenant by customDomain.
  const hostname = req.headers.get('host') || ''
  if (!isPlatformHost(hostname)) {
    const url = req.nextUrl.clone()
    url.pathname = '/diagnostic/custom-domain'
    const res = NextResponse.rewrite(url)
    res.headers.set('x-custom-domain', hostname.split(':')[0])
    return res
  }
  // ─────────────────────────────────────────────────────────

  if (isPublicRoute(req)) return NextResponse.next()

  const { userId, sessionClaims } = await auth()

  if (!userId) {
    const signInUrl = new URL('/sign-in', req.url)
    signInUrl.searchParams.set('redirect_url', req.url)
    return NextResponse.redirect(signInUrl)
  }

  const metadata = sessionClaims?.metadata as Record<string, string> | undefined
  const role = metadata?.role || ''

  // If role is missing, let the page/layout handle the MongoDB check to avoid redirect loops due to Clerk metadata sync latency
  if (!role) {
    // Only redirect if they are not already going to onboarding
    if (!isPublicRoute(req)) {
      // We'll let them through and let the layout/page redirect them to /onboarding if needed from MongoDB
      return NextResponse.next()
    }
  }

  if (isPlatformAdminRoute(req) && role && role !== 'platform_admin') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
  if (isBankRoute(req) && role && !['bank_admin', 'bank_staff'].includes(role)) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
  if (isSMERoute(req) && role && role !== 'sme') {
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
