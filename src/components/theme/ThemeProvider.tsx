'use client'
// src/components/theme/ThemeProvider.tsx
// Injects bank theme CSS variables into the document root
// Wrap bank and SME layouts with this provider

import { createContext, useContext, useEffect, type ReactNode } from 'react'
import type { BankTheme } from '@/types'

const ThemeContext = createContext<BankTheme | null>(null)

export function useTheme(): BankTheme {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

interface ThemeProviderProps {
  theme:    BankTheme
  children: ReactNode
}

export default function ThemeProvider({ theme, children }: ThemeProviderProps) {
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--brand-primary',       theme.primary)
    root.style.setProperty('--brand-primary-light', theme.primaryLight)
    root.style.setProperty('--brand-primary-dark',  theme.primaryDark)
    root.style.setProperty('--brand-accent',        theme.accent)
    return () => {
      // Reset to InnoSL defaults on unmount
      root.style.setProperty('--brand-primary',       '#0F6E56')
      root.style.setProperty('--brand-primary-light', '#E1F5EE')
      root.style.setProperty('--brand-primary-dark',  '#04342C')
      root.style.setProperty('--brand-accent',        '#1D9E75')
    }
  }, [theme])

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  )
}

// ── SIDEBAR NAV ITEM ──────────────────────────────────────
// Uses brand colour from theme for active state
export function NavItem({ label, href, active, icon }: {
  label: string; href: string; active?: boolean; icon?: ReactNode
}) {
  const theme = useContext(ThemeContext)
  return (
    <a href={href} className={`
      flex items-center gap-2.5 px-3.5 py-2 text-sm rounded-md transition-all duration-150
      ${active ? 'font-medium' : 'opacity-70 hover:opacity-90 hover:bg-white/5'}
    `} style={active ? {
      background: 'rgba(255,255,255,0.12)',
      color: '#fff',
      borderLeft: `3px solid rgba(255,255,255,0.6)`,
    } : { color: '#fff' }}>
      {icon && <span className="w-4 h-4 opacity-80">{icon}</span>}
      {label}
    </a>
  )
}
