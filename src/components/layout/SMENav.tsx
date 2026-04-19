'use client'
// src/components/layout/SMENav.tsx
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'

const NAV = [
  { href: '/sme/progress',    label: 'Overview' },
  { href: '/sme/diagnostics', label: 'Assessments' },
  { href: '/sme/ta',          label: 'Programmes' },
]

export default function SMENav({ businessName }: { businessName: string | null }) {
  const path = usePathname()

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200/60">
      <div className="max-w-5xl mx-auto px-5 lg:px-8 h-14 flex items-center justify-between gap-6">

        {/* Brand */}
        <Link href="/sme/progress" className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white"
            style={{ background: 'linear-gradient(135deg,#5B1FA8,#185FA5)' }}>
            B
          </div>
          <span className="text-sm font-semibold text-gray-900 hidden sm:block">BizReady</span>
        </Link>

        {/* Pill nav */}
        <nav className="flex items-center gap-0.5 bg-gray-100 rounded-full p-1">
          {NAV.map(item => {
            const active = path === item.href || path.startsWith(item.href + '/')
            return (
              <Link key={item.href} href={item.href}
                className="px-4 py-1.5 rounded-full text-[13px] font-medium transition-all"
                style={active
                  ? { background: '#fff', color: '#111', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                  : { color: '#6B7280' }}>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Business chip + avatar */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {businessName && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100">
              <div className="w-4 h-4 rounded-full bg-violet-600 flex items-center justify-center text-[8px] text-white font-bold">
                {businessName[0]?.toUpperCase()}
              </div>
              <span className="text-[11px] font-medium text-gray-600 max-w-[120px] truncate">{businessName}</span>
            </div>
          )}
          <UserButton afterSignOutUrl="/sign-in"
            appearance={{ elements: { avatarBox: 'w-7 h-7' } }} />
        </div>
      </div>
    </header>
  )
}
