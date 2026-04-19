// src/app/sme/layout.tsx
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { connectDB } from '@/lib/db'
import { User, Business } from '@/models'
import { UserButton } from '@clerk/nextjs'

export default async function SMELayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  await connectDB()

  const user = await User.findOne({ clerkId: userId }).lean() as any
  if (!user || user.role !== 'sme') redirect('/dashboard')

  const business = user.businessId
    ? await Business.findById(user.businessId).lean() as any
    : null

  const nav = [
    { href: '/sme/progress',    label: 'My Progress' },
    { href: '/sme/diagnostics', label: 'Diagnostics' },
    { href: '/sme/ta',          label: 'TA Programme' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 lg:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4 lg:gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-purple-600 flex items-center justify-center text-[10px] text-white font-semibold">B</div>
              <span className="text-sm font-semibold text-gray-900">BizReady</span>
            </div>
            <nav className="hidden lg:flex gap-1">
              {nav.map(item => (
                <Link key={item.href} href={item.href}
                  className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {business && (
              <span className="text-xs text-gray-500 hidden sm:block">{business.name}</span>
            )}
            <UserButton afterSignOutUrl="/sign-in"
              appearance={{ elements: { avatarBox: 'w-7 h-7' } }} />
          </div>
        </div>

        {/* Mobile nav */}
        <div className="lg:hidden border-t border-gray-100">
          <div className="max-w-4xl mx-auto px-4">
            <nav className="flex gap-1 py-2 overflow-x-auto">
              {nav.map(item => (
                <Link key={item.href} href={item.href}
                  className="px-3 py-2 rounded-md text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors whitespace-nowrap">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 lg:px-6">{children}</main>
    </div>
  )
}
