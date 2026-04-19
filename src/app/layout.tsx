import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export const metadata: Metadata = {
  title: 'BizReady - SME Investment Readiness Diagnostic Platform',
  description: 'Business readiness. Loan confidence. Powered by Innovation SL',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        <ClerkProvider afterSignUpUrl="/onboarding" afterSignInUrl="/dashboard">
          {children}
        </ClerkProvider>
      </body>
    </html>
  )
}
