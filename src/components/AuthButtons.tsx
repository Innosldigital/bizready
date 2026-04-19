'use client'

import { SignInButton, SignUpButton, UserButton, SignedIn, SignedOut } from '@clerk/nextjs'

const PURPLE = '#5B1FA8'

export function AuthButtons() {
  return (
    <>
      <SignedOut>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <SignInButton mode="modal">
            <button style={{ fontSize: 13, color: '#555', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', padding: '8px 4px' }}>
              Sign in
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button style={{ fontSize: 13, padding: '8px 20px', borderRadius: 8, background: PURPLE, color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
              Get started
            </button>
          </SignUpButton>
        </div>
      </SignedOut>
      <SignedIn>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/bank/dashboard" style={{ fontSize: 13, color: '#555', textDecoration: 'none', fontWeight: 500 }}>Dashboard</a>
          <UserButton afterSignOutUrl="/" />
        </div>
      </SignedIn>
    </>
  )
}