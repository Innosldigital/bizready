'use client'
// src/components/layout/AdminSidebar.tsx
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'

const NAV = [
  { label: 'Dashboard',     href: '/admin/dashboard',   icon: '\u25A3', group: 'overview' },
  { label: 'Tenants',       href: '/admin/tenants',     icon: '\u25A1', group: 'overview' },
  { label: 'Diagnostics',   href: '/admin/diagnostics', icon: '\u2261', group: 'overview' },
  { label: 'Question bank', href: '/admin/questions',   icon: '\u25CF', group: 'platform' },
  { label: 'Audit log',     href: '/admin/audit',       icon: '\u25A5', group: 'platform' },
  { label: 'Billing',       href: '/admin/billing',     icon: '\u25A4', group: 'platform' },
]

export default function AdminSidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const path = usePathname()
  const isActive = (href: string) => path === href || path.startsWith(`${href}/`)

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

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 lg:w-48 flex-shrink-0 flex flex-col min-h-screen
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `} style={{ background: '#3B1270' }}>

        {/* Close button for mobile */}
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
      <div className="px-4 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-medium"
            style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
            BIZ
          </div>
          <div>
            <p className="text-xs font-medium text-white leading-tight">BizReady</p>
            <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.45)' }}>Platform Admin</p>
          </div>
        </div>
      </div>

      {/* Role badge */}
      <div className="px-4 py-2.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
        <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Access level</p>
        <p className="text-xs font-medium text-white">Super Admin</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5">
        <p className="text-[9px] px-2 py-1 font-medium uppercase tracking-wider"
          style={{ color: 'rgba(255,255,255,0.35)' }}>Overview</p>
        {NAV.filter(n => n.group === 'overview').map(item => (
          <Link key={item.href} href={item.href}
            className="flex items-center gap-2 px-2.5 py-2 rounded-md text-xs transition-all"
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
          style={{ color: 'rgba(255,255,255,0.35)' }}>Platform</p>
        {NAV.filter(n => n.group === 'platform').map(item => (
          <Link key={item.href} href={item.href}
            className="flex items-center gap-2 px-2.5 py-2 rounded-md text-xs transition-all"
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
      </nav>

      {/* User */}
      <div className="px-4 py-3 border-t flex items-center gap-2.5"
        style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
        <UserButton afterSignOutUrl="/sign-in"
          appearance={{ elements: { avatarBox: 'w-7 h-7' } }} />
        <div>
          <p className="text-xs text-white font-medium">InnoSL</p>
          <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.45)' }}>platform_admin</p>
        </div>
      </div>
    </aside>
    </>
  )
}
