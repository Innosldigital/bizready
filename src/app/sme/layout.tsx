// src/app/sme/layout.tsx
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db'
import { User } from '@/models'

export default async function SMELayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  await connectDB()

  const user = await User.findOne({ clerkId: userId }).lean() as any
  if (!user || user.role !== 'sme') redirect('/dashboard')

  return <>{children}</>
}
