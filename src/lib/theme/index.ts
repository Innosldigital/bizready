// src/lib/theme/index.ts
// Theme resolution and CSS variable injection for white-labelling

import type React from 'react'
import type { BankTheme } from '@/types'
import { BANK_PRESETS } from '@/types'

// ── RESOLVE THEME FOR A TENANT ────────────────────────────
export function resolveTheme(tenantSlug: string, customTheme?: Partial<BankTheme>): BankTheme {
  const preset = BANK_PRESETS[tenantSlug] || BANK_PRESETS.innosl
  return { ...preset, ...customTheme }
}

// ── GENERATE CSS VARIABLES STRING ────────────────────────
// Injected into <head> as a <style> tag for server-side rendering
export function generateThemeCSS(theme: BankTheme): string {
  return `
    :root {
      --brand-primary:       ${theme.primary};
      --brand-primary-light: ${theme.primaryLight};
      --brand-primary-dark:  ${theme.primaryDark};
      --brand-accent:        ${theme.accent};
      --brand-font:          '${theme.fontFamily}', system-ui, sans-serif;
    }
    .brand-bg         { background-color: var(--brand-primary) !important; }
    .brand-text       { color: var(--brand-primary) !important; }
    .brand-border     { border-color: var(--brand-primary) !important; }
    .brand-bg-light   { background-color: var(--brand-primary-light) !important; }
    .brand-ring:focus { box-shadow: 0 0 0 2px var(--brand-primary) !important; }
  `.trim()
}

// ── GENERATE INLINE STYLE OBJECT (for React components) ──
export function themeVars(theme: BankTheme): React.CSSProperties {
  return {
    '--brand-primary':       theme.primary,
    '--brand-primary-light': theme.primaryLight,
    '--brand-primary-dark':  theme.primaryDark,
    '--brand-accent':        theme.accent,
  } as React.CSSProperties
}

// ── CLASSIFICATION HELPERS ────────────────────────────────
export function getClassificationStyle(index: number) {
  if (index >= 80) return { color: '#0F6E56', bg: '#E1F5EE', label: 'Investment Ready',        emoji: '🟢' }
  if (index >= 60) return { color: '#BA7517', bg: '#FAEEDA', label: 'Conditionally Lendable',  emoji: '🟡' }
  return               { color: '#A32D2D', bg: '#FCEBEB', label: 'High Risk',                  emoji: '🔴' }
}

// src/hooks/useTheme.ts
// Client-side hook to access the current tenant theme
export { }
