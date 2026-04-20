'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { useDarkMode } from '@/components/providers/DarkModeContext'

const NAV = [
  { label: 'Dashboard',    href: '/bank/dashboard',  icon: '\u25A3' },
  { label: 'Submissions',  href: '/bank/submissions', icon: '\u2261' },
  { label: 'SME profiles', href: '/bank/sme',         icon: '\u25A1' },
  { label: 'Analytics',    href: '/bank/analytics',   icon: '\u25B2' },
  { label: 'TA programmes',href: '/bank/ta',          icon: '\u25CF' },
  { label: 'Questions',    href: '/bank/questions',   icon: '\u2B1C' },
  { label: 'Reports',      href: '/bank/reports',     icon: '\u25A4' },
  { label: 'Settings',     href: '/bank/settings',    icon: '\u2699' },
]

const SUPPORT_EMAIL: Record<string, string> = {
  starter:    'support@bizready.io',
  growth:     'priority@bizready.io',
  enterprise: 'enterprise@bizready.io',
  owner:      'enterprise@bizready.io',
}

export default function BankSidebar({ tenant, userRole }: { tenant: any; userRole: string }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const path    = usePathname()
  const theme   = tenant.theme
  const isAdmin = userRole === 'bank_admin'
  const isActive = (href: string) => path === href || path.startsWith(`${href}/`)
  const { isDark, toggle } = useDarkMode()

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="w-10 h-10 rounded-lg bg-white shadow-lg border border-gray-200 flex items-center justify-center"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar — fixed on mobile, sticky on desktop */}
      <aside className={`
        fixed lg:sticky lg:top-0 lg:h-screen inset-y-0 left-0 z-50
        w-64 lg:w-48 flex-shrink-0 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `} style={{ background: theme.primary }}>

        {/* Close button (mobile only) */}
        <div className="lg:hidden absolute top-4 right-4">
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-8 h-8 rounded-lg bg-white bg-opacity-20 flex items-center justify-center"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Logo */}
        <div className="px-4 py-4 border-b flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-medium"
              style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
              {theme.abbreviation}
            </div>
            <div>
              <p className="text-xs font-medium text-white leading-tight">{theme.bankName}</p>
              <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.55)' }}>BizReady &middot; InnoSL</p>
            </div>
          </div>
        </div>

        {/* Plan badge + dark mode toggle row */}
        <div className="px-4 py-2.5 border-b flex items-center justify-between flex-shrink-0"
          style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
          <div>
            <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.45)' }}>Active plan</p>
            <p className="text-xs font-medium text-white capitalize">{tenant.plan} Plan</p>
          </div>
          {/* Dark mode toggle */}
          <button
            onClick={toggle}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
            style={{ background: 'rgba(255,255,255,0.12)' }}
          >
            {isDark ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>
        </div>

        {/* Nav — scrollable */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 flex flex-col gap-0.5">
          <p className="text-[9px] px-2 py-1 font-medium uppercase tracking-wider"
            style={{ color: 'rgba(255,255,255,0.35)' }}>Overview</p>
          {NAV.slice(0, 4).map(item => (
            <Link key={item.href} href={item.href}
              className="nav-link-shimmer flex items-center gap-2 px-2.5 py-2 rounded-md text-xs transition-all"
              style={isActive(item.href) ? {
                background: 'rgba(255,255,255,0.12)',
                color: '#fff',
                fontWeight: 500,
                borderLeft: '2px solid rgba(255,255,255,0.6)',
              } : { color: 'rgba(255,255,255,0.65)' }}>
              <span style={{ fontSize: 12 }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
          <p className="text-[9px] px-2 py-1 mt-2 font-medium uppercase tracking-wider"
            style={{ color: 'rgba(255,255,255,0.35)' }}>Management</p>
          {NAV.slice(4).map(item => (
            <Link key={item.href} href={item.href}
              className="nav-link-shimmer flex items-center gap-2 px-2.5 py-2 rounded-md text-xs transition-all"
              style={isActive(item.href) ? {
                background: 'rgba(255,255,255,0.12)',
                color: '#fff',
                fontWeight: 500,
                borderLeft: '2px solid rgba(255,255,255,0.6)',
              } : { color: 'rgba(255,255,255,0.65)' }}>
              <span style={{ fontSize: 12 }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
          <Link
            href="/bank/onboarding-setup"
            className="nav-link-shimmer flex items-center gap-2 px-2.5 py-2 rounded-md text-xs transition-all mt-1"
            style={isActive('/bank/onboarding-setup') ? {
              background: 'rgba(255,255,255,0.12)', color: '#fff', fontWeight: 500,
              borderLeft: '2px solid rgba(255,255,255,0.6)',
            } : { color: 'rgba(255,255,255,0.65)' }}
          >
            <span style={{ fontSize: 12 }}>✓</span>
            Setup Guide
          </Link>
        </nav>

        {/* Priority support widget */}
        <div className="mx-3 mb-3 rounded-lg p-3 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <p className="text-[9px] font-semibold uppercase tracking-wider mb-1"
            style={{ color: 'rgba(255,255,255,0.5)' }}>
            {tenant.plan === 'starter' ? 'Support' : tenant.plan === 'growth' ? 'Priority Support' : 'Enterprise Support'}
          </p>
          {tenant.successManagerName ? (
            <div>
              <p className="text-[10px] text-white font-medium">{tenant.successManagerName}</p>
              <a href={`mailto:${tenant.successManagerEmail}`} className="text-[9px] hover:underline"
                style={{ color: 'rgba(255,255,255,0.65)' }}>{tenant.successManagerEmail}</a>
            </div>
          ) : (
            <a
              href={`mailto:${SUPPORT_EMAIL[tenant.plan] ?? SUPPORT_EMAIL.starter}?subject=Support%20Request%20%5B${encodeURIComponent(tenant.theme?.bankName ?? tenant.name)}%5D`}
              className="text-[10px] hover:underline"
              style={{ color: 'rgba(255,255,255,0.75)' }}
            >
              {SUPPORT_EMAIL[tenant.plan] ?? SUPPORT_EMAIL.starter}
            </a>
          )}
          {tenant.plan !== 'starter' && (
            <p className="text-[9px] mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {tenant.plan === 'growth' ? '< 4h response SLA' : '< 1h response SLA'}
            </p>
          )}
        </div>

        {/* User */}
        <div className="px-4 py-3 border-t flex items-center gap-2.5 flex-shrink-0"
          style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
          <UserButton afterSignOutUrl="/sign-in"
            appearance={{ elements: { avatarBox: 'w-7 h-7' } }} />
          <div>
            <p className="text-xs text-white font-medium">{isAdmin ? 'Admin' : 'Staff'}</p>
            <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.45)' }}>{userRole.replace('_', ' ')}</p>
          </div>
        </div>
      </aside>
    </>
  )
}
