// src/app/sme/layout.tsx
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db'
import { User, Business } from '@/models'
import SMENav from '@/components/layout/SMENav'

export default async function SMELayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  await connectDB()

  const user = await User.findOne({ clerkId: userId }).lean() as any
  if (!user || user.role !== 'sme') redirect('/dashboard')

  const business = user.businessId
    ? await Business.findById(user.businessId).lean() as any
    : null

  return (
    <div className="min-h-screen" style={{ background: '#F5F5F7' }}>
      <SMENav businessName={business?.name ?? null} />
      <main className="max-w-5xl mx-auto px-5 lg:px-8 py-8">{children}</main>
    </div>
  )
}
