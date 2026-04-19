// src/app/ext/layout.tsx
// Read-only external viewer portal (UNDP, ILO, Banks, etc.)

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db'
import { User } from '@/models'
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/roles'
import { UserButton } from '@clerk/nextjs'

export default async function ExtLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  await connectDB()

  const user = await User.findOne({ clerkId: userId }).lean() as any
  if (!user) redirect('/onboarding')
  if (user.role !== 'external_viewer') redirect('/dashboard')
  if (!user.isActive) redirect('/sign-in')

  const c = ROLE_COLORS.external_viewer

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-gray-800 flex items-center justify-center text-[10px] text-white font-semibold">
              INN
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 leading-tight">InnoSL BizReady</p>
              <p className="text-[9px] text-gray-400">Stakeholder View</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={{ background: c.bg, color: c.text }}>
              {ROLE_LABELS[user.role]}
            </span>
            <span className="text-xs text-gray-500 hidden sm:block">{user.name}</span>
            <UserButton afterSignOutUrl="/sign-in"
              appearance={{ elements: { avatarBox: 'w-7 h-7' } }} />
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 lg:px-6 py-6">{children}</main>
    </div>
  )
}
