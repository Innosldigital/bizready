'use client'
// src/app/onboarding/bank-setup/page.tsx
// 3-step onboarding wizard for new bank admins

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'

// ── Design tokens ─────────────────────────────────────────────────────────────
const P      = '#5B1FA8'
const PD     = '#3B1270'
const PL     = '#EDE9FE'
const BG     = '#F8F7FF'
const BORDER = '#E9E3F8'
const TEXT   = '#1F1535'
const MUTED  = '#6B7280'
const WHITE  = '#ffffff'

// ── Theme presets (colour-scheme cards the bank picks from) ───────────────────
// Derived from BANK_PRESETS in types/index.ts — presented as generic palettes
const THEME_PRESETS = [
  { key: 'uba',      label: 'UBA',     primary: '#C8102E', primaryLight: '#FDE8EB', primaryDark: '#1A0005', accent: '#FFD700', fontFamily: 'Inter'   as const },
  { key: 'slcb',     label: 'SLCB',    primary: '#C8102E', primaryLight: '#FDE8EB', primaryDark: '#8B0000', accent: '#FFD700', fontFamily: 'Inter'   as const },
  { key: 'rokel',    label: 'Rokel',   primary: '#DAA520', primaryLight: '#FFF8E1', primaryDark: '#003580', accent: '#003580', fontFamily: 'Inter'   as const },
  { key: 'vista',    label: 'Vista',   primary: '#C8102E', primaryLight: '#FDE8EB', primaryDark: '#8B0000', accent: '#FFFFFF', fontFamily: 'Inter'   as const },
  { key: 'gtbank',   label: 'GTBank',  primary: '#F68B1F', primaryLight: '#FEF4E6', primaryDark: '#5A3200', accent: '#FFFFFF', fontFamily: 'Inter'   as const },
  { key: 'ecobank',  label: 'Ecobank', primary: '#009A44', primaryLight: '#E0F5EB', primaryDark: '#003318', accent: '#0065BD', fontFamily: 'Inter'   as const },
  { key: 'access',   label: 'Access',  primary: '#E87722', primaryLight: '#FEF0E4', primaryDark: '#2A1000', accent: '#003366', fontFamily: 'Inter'   as const },
  { key: 'brac',     label: 'BRAC',    primary: '#E41E26', primaryLight: '#FDEAEA', primaryDark: '#1A0002', accent: '#F47920', fontFamily: 'Inter'   as const },
  { key: 'ifc',      label: 'IFC/WB',  primary: '#003F6B', primaryLight: '#E0EBF4', primaryDark: '#00152A', accent: '#F5A623', fontFamily: 'Georgia' as const },
  { key: 'zenith',   label: 'Zenith',  primary: '#841D4D', primaryLight: '#F7EAF1', primaryDark: '#3D0020', accent: '#FFD700', fontFamily: 'Inter'   as const },
  { key: 'afdb',     label: 'AfDB',    primary: '#007DC3', primaryLight: '#E0F2FB', primaryDark: '#003558', accent: '#F5A623', fontFamily: 'Inter'   as const },
  { key: 'violet',   label: 'InnoSL',  primary: '#5B1FA8', primaryLight: '#EDE9FE', primaryDark: '#3B1270', accent: '#0EA5E9', fontFamily: 'Inter'   as const },
] as const

const FONTS = ['Inter', 'Georgia', 'Roboto', 'Lato'] as const

// ── Helpers ───────────────────────────────────────────────────────────────────
function slugPreview(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim() || 'your-bank'
}

function lighten(hex: string): string {
  try {
    const n = parseInt(hex.replace('#', ''), 16)
    const r = Math.round(((n >> 16) & 255) + (255 - ((n >> 16) & 255)) * 0.70)
    const g = Math.round(((n >>  8) & 255) + (255 - ((n >>  8) & 255)) * 0.70)
    const b = Math.round(( n        & 255) + (255 - ( n        & 255)) * 0.70)
    return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`
  } catch { return '#EDE9FE' }
}

// ── Shared sub-components ─────────────────────────────────────────────────────
function Field({ label, hint, required, children }: {
  label: string; hint?: string; required?: boolean; children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: TEXT, marginBottom: 8 }}>
        {label}{required && <span style={{ color: '#EF4444', marginLeft: 3 }}>*</span>}
      </label>
      <div style={{ position: 'relative' }}>
        {children}
      </div>
      {hint && <p style={{ fontSize: 12, color: MUTED, marginTop: 6, lineHeight: 1.4 }}>{hint}</p>}
    </div>
  )
}

const INP_STYLE: React.CSSProperties = {
  width: '100%', 
  padding: '12px 16px', 
  borderRadius: 10,
  border: `1.5px solid ${BORDER}`, 
  fontSize: 14, 
  color: TEXT,
  background: WHITE, 
  outline: 'none', 
  boxSizing: 'border-box', 
  fontFamily: 'inherit',
  transition: 'all 0.2s ease',
}

function Steps({ current }: { current: number }) {
  const labels = ['Bank profile', 'Choose theme', 'Review & launch']
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 40, maxWidth: 500, margin: '0 auto 40px' }}>
      {labels.map((s, i) => {
        const n = i + 1; const done = n < current; const active = n === current
        return (
          <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < labels.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, position: 'relative' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: done || active ? P : BORDER,
                color: done || active ? WHITE : MUTED,
                border: active ? `2px solid ${WHITE}` : 'none',
                boxShadow: active ? `0 0 0 2px ${P}` : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, boxSizing: 'border-box',
                transition: 'all 0.3s ease',
                zIndex: 2,
              }}>
                {done ? '✓' : n}
              </div>
              <span style={{ 
                fontSize: 11, 
                fontWeight: active ? 700 : 500, 
                color: active ? P : MUTED, 
                whiteSpace: 'nowrap',
                position: 'absolute',
                top: 40,
                left: '50%',
                transform: 'translateX(-50%)',
              }}>{s}</span>
            </div>
            {i < labels.length - 1 && (
              <div style={{ 
                flex: 1, 
                height: 3, 
                background: done ? P : BORDER, 
                margin: '0 -10px', 
                marginBottom: 0, 
                minWidth: 40,
                transition: 'all 0.3s ease',
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Mini portal preview (shows sidebar + content area) ────────────────────────
function PortalPreview({ primary, primaryLight, accent, fontFamily, bankName, abbreviation, tagline }: {
  primary: string; primaryLight: string; accent: string; fontFamily: string
  bankName: string; abbreviation: string; tagline?: string
}) {
  const abbr = (abbreviation || 'BK').toUpperCase().slice(0, 4)
  const name = bankName || 'Your Bank'

  return (
    <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${BORDER}`, boxShadow: '0 4px 16px rgba(0,0,0,0.10)', display: 'flex', height: 220 }}>
      {/* Sidebar */}
      <div style={{ width: 88, background: primary, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        {/* Bank header */}
        <div style={{ padding: '10px 8px', borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
          <div style={{ width: 24, height: 24, borderRadius: 5, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: WHITE, marginBottom: 4 }}>
            {abbr.slice(0, 2)}
          </div>
          <div style={{ fontSize: 7.5, fontWeight: 600, color: WHITE, lineHeight: 1.3, fontFamily }}>{name}</div>
          <div style={{ fontSize: 6, color: 'rgba(255,255,255,0.5)', marginTop: 1, fontFamily }}>BizReady · InnoSL</div>
        </div>
        {/* Nav items */}
        <div style={{ padding: '8px 6px', flex: 1 }}>
          {['Dashboard', 'Submissions', 'SME profiles', 'Analytics', 'TA progs', 'Reports', 'Settings'].map((item, i) => (
            <div key={item} style={{
              padding: '4px 6px', borderRadius: 4, marginBottom: 2, fontSize: 7,
              fontFamily,
              background: i === 0 ? 'rgba(255,255,255,0.12)' : 'transparent',
              color: i === 0 ? WHITE : 'rgba(255,255,255,0.55)',
              borderLeft: i === 0 ? '2px solid rgba(255,255,255,0.5)' : '2px solid transparent',
            }}>
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Main content area */}
      <div style={{ flex: 1, background: '#F9FAFB', padding: 10, overflow: 'hidden' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: TEXT, fontFamily }}>Dashboard</div>
            <div style={{ fontSize: 7, color: MUTED, fontFamily }}>{tagline || 'SME Investment Readiness'}</div>
          </div>
          <div style={{ fontSize: 7, padding: '3px 8px', borderRadius: 4, background: accent, color: WHITE, fontWeight: 600, fontFamily }}>
            + New
          </div>
        </div>
        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 5, marginBottom: 8 }}>
          {[['24', 'Submissions'], ['71%', 'Avg. Index'], ['8', 'Ready']].map(([v, l]) => (
            <div key={l} style={{ background: WHITE, borderRadius: 5, padding: '5px 6px', border: `1px solid ${BORDER}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: primary, fontFamily }}>{v}</div>
              <div style={{ fontSize: 6.5, color: MUTED, fontFamily }}>{l}</div>
            </div>
          ))}
        </div>
        {/* Table rows */}
        <div style={{ background: WHITE, borderRadius: 5, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
          {[['Kamara Enterprises', '82%', primaryLight], ['West Africa Foods', '64%', '#FEF9EC'], ['Krio Traders Ltd', '48%', '#FFF0F0']].map(([name, score, bg]) => (
            <div key={name as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 6px', borderBottom: `1px solid ${BORDER}`, background: bg as string }}>
              <span style={{ fontSize: 7, color: TEXT, fontFamily }}>{name}</span>
              <span style={{ fontSize: 7, fontWeight: 600, color: TEXT, fontFamily }}>{score}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Theme preset card ─────────────────────────────────────────────────────────
function ThemeCard({ preset, selected, onClick }: {
  preset: typeof THEME_PRESETS[number]
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: 0, border: `2px solid ${selected ? P : BORDER}`,
        borderRadius: 10, background: WHITE, cursor: 'pointer', overflow: 'hidden',
        boxShadow: selected ? `0 0 0 3px ${PL}` : 'none',
        transition: 'all 0.15s', position: 'relative',
      }}
    >
      {/* Colour strip */}
      <div style={{ height: 36, background: preset.primary, display: 'flex', alignItems: 'flex-end', padding: '0 8px 5px', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: preset.primaryLight, opacity: 0.8 }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: preset.accent }} />
        </div>
        {selected && (
          <div style={{ width: 16, height: 16, borderRadius: '50%', background: WHITE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: P, fontWeight: 700 }}>✓</div>
        )}
      </div>
      {/* Label */}
      <div style={{ padding: '6px 8px', textAlign: 'left' }}>
        <div style={{ fontSize: 11, fontWeight: selected ? 700 : 500, color: selected ? P : TEXT }}>{preset.label}</div>
        <div style={{ fontSize: 9, color: MUTED, fontFamily: preset.fontFamily }}>{preset.fontFamily}</div>
      </div>
    </button>
  )
}

// ── Custom colour picker row ───────────────────────────────────────────────────
function ColourRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <label style={{ fontSize: 12, color: TEXT, fontWeight: 500, width: 110, flexShrink: 0 }}>{label}</label>
      <input type="color" value={value || '#000000'} onChange={e => onChange(e.target.value)}
        style={{ width: 36, height: 32, borderRadius: 6, border: `1.5px solid ${BORDER}`, cursor: 'pointer', padding: 2 }} />
      <input
        style={{ ...inp, flex: 1, fontFamily: 'monospace', fontSize: 13, padding: '6px 10px' }}
        value={value} maxLength={7}
        onChange={e => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) onChange(e.target.value) }}
        placeholder="#000000"
      />
    </div>
  )
}

// ── Form state ────────────────────────────────────────────────────────────────
interface FormState {
  bankName: string; abbreviation: string; tagline: string
  contactEmail: string; country: string; region: string
  primaryColor: string; primaryLight: string; primaryDark: string
  accentColor: string; fontFamily: string; logoUrl: string
  selectedPreset: string
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function BankSetupPage() {
  const router   = useRouter()
  const { user } = useUser()
  const [step,    setStep]    = useState(1)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [customOpen, setCustomOpen] = useState(false)

  const [form, setForm] = useState<FormState>({
    bankName: '', abbreviation: '', tagline: '',
    contactEmail: '', country: 'Sierra Leone', region: 'West Africa',
    primaryColor:  THEME_PRESETS[0].primary,
    primaryLight:  THEME_PRESETS[0].primaryLight,
    primaryDark:   THEME_PRESETS[0].primaryDark,
    accentColor:   THEME_PRESETS[0].accent,
    fontFamily:    THEME_PRESETS[0].fontFamily,
    logoUrl: '', selectedPreset: THEME_PRESETS[0].key,
  })

  useEffect(() => {
    // If user is a platform admin, they don't belong here
    if (user?.publicMetadata?.role === 'platform_admin') {
      router.push('/admin/dashboard')
      return
    }

    const email = user?.emailAddresses?.[0]?.emailAddress
    if (email) setForm(f => ({ ...f, contactEmail: f.contactEmail || email }))
  }, [user, router])

  const set = (k: keyof FormState, v: string) => setForm(f => ({ ...f, [k]: v }))

  const applyPreset = (preset: typeof THEME_PRESETS[number]) => {
    setForm(f => ({
      ...f,
      primaryColor:  preset.primary,
      primaryLight:  preset.primaryLight,
      primaryDark:   preset.primaryDark,
      accentColor:   preset.accent,
      fontFamily:    preset.fontFamily,
      selectedPreset: preset.key,
    }))
    setCustomOpen(false)
  }

  const step1Valid = form.bankName.trim().length >= 2 && form.abbreviation.trim().length >= 1 && form.contactEmail.includes('@')
  const step2Valid = /^#[0-9a-fA-F]{6}$/.test(form.primaryColor) && /^#[0-9a-fA-F]{6}$/.test(form.accentColor)
  const canAdvance = step === 1 ? step1Valid : step === 2 ? step2Valid : true

  const submit = async () => {
    setLoading(true); setError('')
    try {
      const res  = await fetch('/api/onboarding/bank-setup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankName:     form.bankName,
          abbreviation: form.abbreviation,
          tagline:      form.tagline,
          contactEmail: form.contactEmail,
          country:      form.country,
          region:       form.region,
          primaryColor: form.primaryColor,
          accentColor:  form.accentColor,
          fontFamily:   form.fontFamily,
          logoUrl:      form.logoUrl,
        }),
      })
      
      const responseText = await res.text()
      let data: any
      try {
        data = JSON.parse(responseText)
      } catch {
        throw new Error('Server returned an invalid response. Please try again.')
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Setup failed — please try again.')
      }
      router.push('/bank/dashboard')
    } catch (e: any) {
      setError(e.message); setLoading(false)
    }
  }

  // ── Wrapper shell ──────────────────────────────────────────────────────────
  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '48px 24px 80px' }}>
      <div style={{ width: '100%', maxWidth: step === 2 ? 860 : 640 }}>
        {/* Brand mark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: P, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: WHITE, fontWeight: 800, fontSize: 16 }}>B</span>
          </div>
          <div>
            <span style={{ fontWeight: 700, fontSize: 17, color: P }}>BizReady</span>
            <span style={{ fontSize: 10, color: MUTED, marginLeft: 6 }}>by Innovation SL</span>
          </div>
        </div>
        <Steps current={step} />
        <div style={{ background: WHITE, borderRadius: 16, border: `0.5px solid ${BORDER}`, padding: '36px 40px', boxShadow: '0 4px 24px rgba(91,31,168,0.06)' }}>
          {children}
        </div>
      </div>
    </div>
  )

  // ── Buttons ────────────────────────────────────────────────────────────────
  const PrimaryBtn = ({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) => (
    <button onClick={onClick} disabled={disabled} style={{
      width: '100%', 
      padding: '14px 24px', 
      borderRadius: 12,
      background: disabled ? BORDER : P, 
      color: disabled ? MUTED : WHITE,
      fontSize: 16, 
      fontWeight: 600, 
      border: 'none', 
      cursor: disabled ? 'not-allowed' : 'pointer',
      boxShadow: disabled ? 'none' : '0 4px 12px rgba(91,31,168,0.25)',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    }}>
      {label}
    </button>
  )
  const BackBtn = ({ onClick }: { onClick: () => void }) => (
    <button onClick={onClick} style={{
      padding: '14px 24px', 
      borderRadius: 12,
      background: WHITE, 
      color: P, 
      fontSize: 16, 
      fontWeight: 600,
      border: `2px solid ${P}`, 
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>← Back</button>
  )

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 1 — Bank profile
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 1) return (
    <Shell>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: TEXT, margin: '0 0 6px' }}>Set up your bank portal</h1>
      <p style={{ fontSize: 14, color: MUTED, margin: '0 0 28px', lineHeight: 1.6 }}>
        Tell us about your institution. This information powers your white-label diagnostic experience.
      </p>

      <Field label="Bank / institution name" required hint="Full name shown in the portal and on all SME result emails">
        <input style={INP_STYLE} placeholder="e.g. First National Bank Sierra Leone"
          value={form.bankName}
          onChange={e => {
            set('bankName', e.target.value)
            if (!form.abbreviation || form.abbreviation === form.bankName.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 4)) {
              const words = e.target.value.trim().split(/\s+/).filter(Boolean)
              set('abbreviation', words.map(w => w[0]).join('').toUpperCase().slice(0, 4))
            }
          }}
        />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Field label="Abbreviation" required hint="2–4 chars shown in sidebar & emails">
          <input style={INP_STYLE} placeholder="e.g. FNB" maxLength={6}
            value={form.abbreviation}
            onChange={e => set('abbreviation', e.target.value.toUpperCase())} />
        </Field>
        <Field label="Tagline" hint="Optional — displayed below your bank name">
          <input style={INP_STYLE} placeholder="e.g. Your bank for life"
            value={form.tagline} onChange={e => set('tagline', e.target.value)} />
        </Field>
      </div>

      <Field label="Notification email" required hint="Receives diagnostic submission alerts and SME result copies">
        <input type="email" style={INP_STYLE} placeholder="diagnostics@yourbank.com"
          value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Field label="Country">
          <input style={INP_STYLE} value={form.country} onChange={e => set('country', e.target.value)} />
        </Field>
        <Field label="Region">
          <input style={INP_STYLE} value={form.region} onChange={e => set('region', e.target.value)} />
        </Field>
      </div>

      <Field label="Logo URL" hint="Optional — direct link to a PNG or SVG (shown in sidebar and diagnostic form)">
        <input style={INP_STYLE} placeholder="https://yourbank.com/logo.png"
          value={form.logoUrl} onChange={e => set('logoUrl', e.target.value)} />
      </Field>

      {/* Slug preview */}
      <div style={{ background: PL, borderRadius: 8, padding: '10px 14px', fontSize: 12, color: PD, fontFamily: 'monospace', marginBottom: 28 }}>
        Diagnostic URL: <strong>/diagnostic/{slugPreview(form.bankName)}</strong>
      </div>

      <PrimaryBtn label="Continue to theme →" onClick={() => setStep(2)} disabled={!canAdvance} />
    </Shell>
  )

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 2 — Choose theme
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 2) return (
    <Shell>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: TEXT, margin: '0 0 6px' }}>Choose your portal theme</h1>
      <p style={{ fontSize: 14, color: MUTED, margin: '0 0 28px', lineHeight: 1.6 }}>
        Select a colour scheme — your entire portal (sidebar, dashboard, emails, diagnostic form) will adopt these colours instantly.
        You can change this anytime from Bank Settings.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>

        {/* Left: theme picker */}
        <div>
          {/* Preset grid */}
          <p style={{ fontSize: 12, fontWeight: 600, color: MUTED, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Select a colour scheme</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 16 }}>
            {THEME_PRESETS.map(preset => (
              <ThemeCard key={preset.key} preset={preset} selected={form.selectedPreset === preset.key && !customOpen} onClick={() => applyPreset(preset)} />
            ))}
          </div>

          {/* Custom colours toggle */}
          <button
            onClick={() => { setCustomOpen(o => !o); set('selectedPreset', customOpen ? form.selectedPreset : 'custom') }}
            style={{
              width: '100%', padding: '9px 14px', borderRadius: 9, fontSize: 13, fontWeight: 500,
              border: `1.5px dashed ${customOpen ? P : BORDER}`,
              background: customOpen ? PL : WHITE,
              color: customOpen ? PD : MUTED, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 0,
            }}
          >
            <span style={{ fontSize: 15 }}>🎨</span>
            {customOpen ? 'Hide custom colours' : 'Use custom colours instead'}
          </button>

          {customOpen && (
            <div style={{ marginTop: 14, padding: '16px', background: BG, borderRadius: 10, border: `1px solid ${BORDER}` }}>
              <ColourRow label="Primary colour"  value={form.primaryColor}  onChange={v => { set('primaryColor', v); set('primaryLight', lighten(v)); set('selectedPreset', 'custom') }} />
              <ColourRow label="Accent colour"   value={form.accentColor}   onChange={v => { set('accentColor', v); set('selectedPreset', 'custom') }} />
              <p style={{ fontSize: 11, color: MUTED, marginTop: 4, marginBottom: 12 }}>
                Light and dark tones are auto-derived from your primary colour.
              </p>
              <Field label="Font family">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {FONTS.map(f => (
                    <button key={f} onClick={() => set('fontFamily', f)} style={{
                      padding: '7px 10px', borderRadius: 7, fontSize: 12, fontFamily: f,
                      border: `1.5px solid ${form.fontFamily === f ? P : BORDER}`,
                      background: form.fontFamily === f ? PL : WHITE,
                      color: form.fontFamily === f ? PD : TEXT,
                      cursor: 'pointer', fontWeight: form.fontFamily === f ? 600 : 400,
                    }}>{f}</button>
                  ))}
                </div>
              </Field>
            </div>
          )}
        </div>

        {/* Right: live portal preview */}
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: MUTED, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Live preview</p>
          <PortalPreview
            primary={form.primaryColor}
            primaryLight={form.primaryLight}
            accent={form.accentColor}
            fontFamily={form.fontFamily}
            bankName={form.bankName}
            abbreviation={form.abbreviation}
            tagline={form.tagline}
          />
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, background: form.primaryColor, borderRadius: 6, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 9, color: WHITE, fontWeight: 600 }}>Primary</span>
            </div>
            <div style={{ flex: 1, background: form.primaryLight, borderRadius: 6, height: 24, border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 9, color: TEXT, fontWeight: 500 }}>Light</span>
            </div>
            <div style={{ flex: 1, background: form.accentColor, borderRadius: 6, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 9, color: WHITE, fontWeight: 600 }}>Accent</span>
            </div>
          </div>
          <p style={{ fontSize: 11, color: MUTED, marginTop: 10, lineHeight: 1.6 }}>
            Your sidebar, dashboard, diagnostic form, and result emails will all use this colour scheme. SMEs and bank staff will see your brand throughout.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
        <BackBtn onClick={() => setStep(1)} />
        <PrimaryBtn label="Review & launch →" onClick={() => setStep(3)} disabled={!canAdvance} />
      </div>
    </Shell>
  )

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 3 — Review & launch
  // ══════════════════════════════════════════════════════════════════════════
  const preset = THEME_PRESETS.find(p => p.key === form.selectedPreset)
  const rows: Array<{ label: string; value: string; type?: 'colour' | 'colours' | 'text' }> = [
    { label: 'Bank name',       value: form.bankName },
    { label: 'Abbreviation',    value: form.abbreviation.toUpperCase() },
    { label: 'Tagline',         value: form.tagline || '—' },
    { label: 'Notification email', value: form.contactEmail },
    { label: 'Country / region',value: `${form.country}, ${form.region}` },
    { label: 'Diagnostic URL',  value: `/diagnostic/${slugPreview(form.bankName)}` },
    { label: 'Logo',            value: form.logoUrl || 'None' },
    { label: 'Theme',           value: preset ? preset.label : 'Custom' },
    { label: 'Colours',         value: '', type: 'colours' },
    { label: 'Font',            value: form.fontFamily },
    { label: 'Plan',            value: 'Starter — upgrade anytime from your billing page' },
  ]

  return (
    <Shell>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: TEXT, margin: '0 0 6px' }}>Ready to launch?</h1>
      <p style={{ fontSize: 14, color: MUTED, margin: '0 0 24px', lineHeight: 1.6 }}>
        Review your setup then launch. Your portal goes live instantly — start sharing the diagnostic link with your SME clients right away.
      </p>

      <div style={{ border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden', marginBottom: 28 }}>
        {rows.map(({ label, value, type }, i) => (
          <div key={label} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 16px', background: i % 2 === 0 ? WHITE : BG,
            borderBottom: i < rows.length - 1 ? `1px solid ${BORDER}` : 'none',
          }}>
            <span style={{ fontSize: 13, color: MUTED, fontWeight: 500, minWidth: 150 }}>{label}</span>
            {type === 'colours' ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {[form.primaryColor, form.primaryLight, form.accentColor].map((c, ci) => (
                  <div key={ci} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 14, height: 14, borderRadius: 3, background: c, border: `1px solid ${BORDER}` }} />
                    <span style={{ fontSize: 11, color: TEXT, fontFamily: 'monospace' }}>{c}</span>
                  </div>
                ))}
              </div>
            ) : (
              <span style={{ fontSize: 13, color: TEXT, fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>{value}</span>
            )}
          </div>
        ))}
      </div>

      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#DC2626', marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 16, marginTop: 32 }}>
        <div style={{ flex: 1 }}>
          <BackBtn onClick={() => setStep(2)} />
        </div>
        <div style={{ flex: 2 }}>
          <button onClick={submit} disabled={loading} style={{
            width: '100%',
            padding: '14px 24px',
            borderRadius: 12,
            background: loading ? BORDER : P,
            color: loading ? MUTED : WHITE,
            fontSize: 16,
            fontWeight: 600,
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 4px 12px rgba(91,31,168,0.25)',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}>
            {loading ? 'Launching portal…' : 'Launch my portal →'}
          </button>
        </div>
      </div>

      <p style={{ fontSize: 11, color: MUTED, textAlign: 'center', marginTop: 16 }}>
        Theme, branding, and contact details can be updated anytime from Bank Settings.
      </p>
    </Shell>
  )
}
