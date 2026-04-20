'use client'
// Client shell for admin layout — manages dark mode state

import { useState, useEffect } from 'react'
import { DarkModeContext } from '@/components/providers/DarkModeContext'
import AdminSidebar from './AdminSidebar'

const STORAGE_KEY = 'bizready-admin-theme'

export default function AdminShell({
  children,
  userRole,
}: {
  children: React.ReactNode
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
        <AdminSidebar userRole={userRole} />
        <main
          className={`flex-1 min-w-0 pt-16 lg:pt-0 transition-colors duration-200 ${active ? 'dashboard-dark' : 'bg-gray-50'}`}
        >
          {children}
        </main>
      </div>
    </DarkModeContext.Provider>
  )
}
