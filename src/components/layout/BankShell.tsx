'use client'
// Client shell for bank layout — manages dark mode state

import { useState, useEffect } from 'react'
import { DarkModeContext } from '@/components/providers/DarkModeContext'
import BankSidebar from './BankSidebar'

const STORAGE_KEY = 'bizready-bank-theme'

export default function BankShell({
  children,
  tenant,
  userRole,
}: {
  children: React.ReactNode
  tenant: any
  userRole: string
}) {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setIsDark(localStorage.getItem(STORAGE_KEY) === 'dark')
    setMounted(true)
  }, [])

  function toggle() {
    setIsDark(prev => {
      const next = !prev
      localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light')
      return next
    })
  }

  const active = mounted && isDark

  return (
    <DarkModeContext.Provider value={{ isDark: active, toggle }}>
      <div className="flex min-h-screen">
        <BankSidebar tenant={tenant} userRole={userRole} />
        <main
          className={`flex-1 min-w-0 pt-16 lg:pt-0 transition-colors duration-200 ${active ? 'dashboard-dark' : ''}`}
          style={{ background: active ? undefined : '#F5F5F7' }}
        >
          <div className="max-w-6xl mx-auto px-5 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </DarkModeContext.Provider>
  )
}
