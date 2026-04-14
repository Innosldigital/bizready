// src/middleware.ts
// Handles: Clerk auth, multi-tenant resolution, role-based routing

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ── PUBLIC ROUTES (no auth required) ─────────────────────
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/diagnostic/(.*)',     // SME diagnostic form — public access via token
  '/api/diagnostic/(.*)', // form submission endpoint
  '/api/webhook/(.*)',    // Stripe + Clerk webhooks
])

// ── ROLE-BASED ROUTE PROTECTION ───────────────────────────
const isPlatformAdminRoute = createRouteMatcher(['/admin(.*)'])
const isBankRoute          = createRouteMatcher(['/bank(.*)'])
const isSMERoute           = createRouteMatcher(['/sme(.*)'])

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // Allow public routes
  if (isPublicRoute(req)) return NextResponse.next()

  const { userId, sessionClaims } = await auth()

  // Require auth for all other routes
  if (!userId) {
    const signInUrl = new URL('/sign-in', req.url)
    signInUrl.searchParams.set('redirect_url', req.url)
    return NextResponse.redirect(signInUrl)
  }

  // Extract role from Clerk session claims (set via Clerk metadata)
  const role = (sessionClaims?.metadata as { role?: string })?.role

  // Platform admin guard
  if (isPlatformAdminRoute(req) && role !== 'platform_admin') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Bank routes guard
  if (isBankRoute(req) && !['bank_admin', 'bank_staff'].includes(role || '')) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // SME routes guard
  if (isSMERoute(req) && role !== 'sme') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Inject tenant slug into request headers for server components
  const tenantSlug = req.headers.get('x-tenant-slug')
    || req.cookies.get('lendiq-tenant')?.value
    || 'default'

  const response = NextResponse.next()
  response.headers.set('x-tenant-slug', tenantSlug)
  response.headers.set('x-user-role', role || 'unknown')
  return response
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
