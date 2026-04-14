'use client'
// src/components/layout/BankSidebar.tsx
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'

const NAV = [
  { label: 'Dashboard',   href: '/bank/dashboard',   icon: '▣' },
  { label: 'Submissions', href: '/bank/submissions',  icon: '≡' },
  { label: 'SME profiles',href: '/bank/sme',          icon: '○' },
  { label: 'Analytics',   href: '/bank/analytics',    icon: '▲' },
  { label: 'TA programmes',href: '/bank/ta',          icon: '□' },
  { label: 'Reports',     href: '/bank/reports',      icon: '◉' },
  { label: 'Settings',    href: '/bank/settings',     icon: '◌' },
]

export default function BankSidebar({ tenant, userRole }: { tenant: any; userRole: string }) {
  const path    = usePathname()
  const theme   = tenant.theme
  const isAdmin = userRole === 'bank_admin'

  return (
    <aside className="w-48 flex-shrink-0 flex flex-col min-h-screen" style={{ background: theme.primary }}>

      {/* Logo */}
      <div className="px-4 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-medium"
            style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
            {theme.abbreviation}
          </div>
          <div>
            <p className="text-xs font-medium text-white leading-tight">{theme.bankName}</p>
            <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.55)' }}>BizReady · InnoSL</p>
          </div>
        </div>
      </div>

      {/* Plan badge */}
      <div className="px-4 py-2.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
        <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.45)' }}>Active plan</p>
        <p className="text-xs font-medium text-white capitalize">{tenant.plan} plan</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5">
        <p className="text-[9px] px-2 py-1 font-medium uppercase tracking-wider"
          style={{ color: 'rgba(255,255,255,0.35)' }}>Overview</p>
        {NAV.slice(0, 4).map(item => (
          <Link key={item.href} href={item.href}
            className="flex items-center gap-2 px-2.5 py-2 rounded-md text-xs transition-all"
            style={path === item.href ? {
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
            className="flex items-center gap-2 px-2.5 py-2 rounded-md text-xs transition-all"
            style={path === item.href ? {
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
          <p className="text-xs text-white font-medium">{isAdmin ? 'Admin' : 'Staff'}</p>
          <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.45)' }}>{userRole.replace('_', ' ')}</p>
        </div>
      </div>
    </aside>
  )
}
