'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'

export default function OnboardingPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function onboardUser() {
      if (!isLoaded || !user) return

      try {
        const res = await fetch('/api/onboarding', {
          method: 'POST',
        })

        if (!res.ok) {
          const text = await res.text()
          throw new Error(text || 'Failed to onboard user')
        }

        const data = await res.json()
        const role = data?.user?.role

        // Redirect to the correct portal based on role
        if (role === 'platform_admin') {
          router.push('/admin/dashboard')
        } else if (role === 'sme') {
          router.push('/sme/progress')
        } else {
          // bank_admin, bank_staff, or fallback
          router.push('/bank/dashboard')
        }
      } catch (err: any) {
        console.error('Onboarding error:', err)
        setError(err.message)
      }
    }

    onboardUser()
  }, [isLoaded, user, router])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 text-center">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4 text-2xl font-bold">!</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Onboarding Error</h1>
        <p className="text-gray-600 mb-6 max-w-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 text-center">
      <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-6"></div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Setting up your account...</h1>
      <p className="text-gray-600">Preparing your BizReady dashboard. This will only take a moment.</p>
    </div>
  )
}
