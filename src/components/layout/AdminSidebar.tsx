'use client'
// src/components/layout/AdminSidebar.tsx
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/roles'

type NavItem = {
  label: string
  href: string
  icon: string
  group: 'overview' | 'platform' | 'team'
  roles?: string[]  // if set, only show for these roles; omit = show to all InnoSL roles
}

const NAV: NavItem[] = [
  { label: 'Dashboard',     href: '/admin/dashboard',   icon: '\u25A3', group: 'overview' },
  { label: 'Tenants',       href: '/admin/tenants',     icon: '\u25A1', group: 'overview',  roles: ['platform_admin', 'innosl_admin'] },
  { label: 'Diagnostics',   href: '/admin/diagnostics', icon: '\u2261', group: 'overview',  roles: ['platform_admin', 'innosl_admin', 'project_manager'] },
  { label: 'My SMEs',       href: '/admin/my-smes',     icon: '\u25CB', group: 'overview',  roles: ['project_manager', 'focal_person'] },
  { label: 'TA Programmes', href: '/admin/ta',           icon: '\u25B6', group: 'overview',  roles: ['platform_admin', 'innosl_admin', 'project_manager'] },
  { label: 'Question bank', href: '/admin/questions',   icon: '\u25CF', group: 'platform',  roles: ['platform_admin', 'innosl_admin'] },
  { label: 'Audit log',     href: '/admin/audit',       icon: '\u25A5', group: 'platform',  roles: ['platform_admin'] },
  { label: 'Billing',       href: '/admin/billing',     icon: '\u25A4', group: 'platform',  roles: ['platform_admin'] },
  { label: 'Staff',         href: '/admin/staff',       icon: '\u25A6', group: 'team',      roles: ['platform_admin'] },
]

export default function AdminSidebar({ userRole }: { userRole: string }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const path = usePathname()
  const isActive = (href: string) => path === href || path.startsWith(`${href}/`)

  const visibleNav = NAV.filter(item =>
    !item.roles || item.roles.includes(userRole)
  )

  const overviewItems = visibleNav.filter(n => n.group === 'overview')
  const platformItems = visibleNav.filter(n => n.group === 'platform')
  const teamItems     = visibleNav.filter(n => n.group === 'team')

  const roleColor = ROLE_COLORS[userRole] ?? ROLE_COLORS.external_viewer

  function NavLink({ item }: { item: NavItem }) {
    return (
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
    )
  }

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
              INN
            </div>
            <div>
              <p className="text-xs font-medium text-white leading-tight">InnoSL</p>
              <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.45)' }}>BizReady Platform</p>
            </div>
          </div>
        </div>

        {/* Role badge */}
        <div className="px-4 py-2.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
          <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Access level</p>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: roleColor.bg, color: roleColor.text }}>
            {ROLE_LABELS[userRole] ?? userRole}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5">
          {overviewItems.length > 0 && (
            <>
              <p className="text-[9px] px-2 py-1 font-medium uppercase tracking-wider"
                style={{ color: 'rgba(255,255,255,0.35)' }}>Overview</p>
              {overviewItems.map(item => <NavLink key={item.href} item={item} />)}
            </>
          )}
          {platformItems.length > 0 && (
            <>
              <p className="text-[9px] px-2 py-1 mt-2 font-medium uppercase tracking-wider"
                style={{ color: 'rgba(255,255,255,0.35)' }}>Platform</p>
              {platformItems.map(item => <NavLink key={item.href} item={item} />)}
            </>
          )}
          {teamItems.length > 0 && (
            <>
              <p className="text-[9px] px-2 py-1 mt-2 font-medium uppercase tracking-wider"
                style={{ color: 'rgba(255,255,255,0.35)' }}>Team</p>
              {teamItems.map(item => <NavLink key={item.href} item={item} />)}
            </>
          )}
        </nav>

        {/* User */}
        <div className="px-4 py-3 border-t flex items-center gap-2.5"
          style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
          <UserButton afterSignOutUrl="/sign-in"
            appearance={{ elements: { avatarBox: 'w-7 h-7' } }} />
          <div>
            <p className="text-xs text-white font-medium">InnoSL</p>
            <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {ROLE_LABELS[userRole] ?? userRole}
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
