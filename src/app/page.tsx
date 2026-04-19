'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, SignUpButton } from '@clerk/nextjs'
import Link from 'next/link'
import { AuthButtons } from '@/components/AuthButtons'

// ── Brand tokens ──────────────────────────────────────────
const P  = '#5B1FA8'
const PD = '#3B1270'
const PL = '#EDE9FE'
const BD = '#0284C7'
const BL = '#E0F2FE'

// ── Navigation ────────────────────────────────────────────
const NAV = [
  { label: 'Features',     href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Pricing',      href: '#pricing' },
  { label: 'About',        href: '#about' },
  { label: 'Contact',      href: '/contact', isPage: true },
]

// ── Hero slides ───────────────────────────────────────────
const SLIDES = [
  {
    eyebrow: 'Powered by Innovation SL',
    headline: ['The Investment\n', 'Readiness Platform', '\nfor African Banks'],
    body: 'Identify SME capacity gaps, build technical assistance plans, and unlock institutional lending across West Africa.',
    cta1: { label: 'Start free trial', signup: true },
    cta2: { label: 'How it works', href: '#how-it-works' },
    bg: 'linear-gradient(135deg, #2D0E6E 0%, #5B1FA8 55%, #1B4FBE 100%)',
    accent: '#7DD3FC',
  },
  {
    eyebrow: 'White-Label Platform',
    headline: ['Your Brand.\n', 'Your Portal.', '\nYour SMEs.'],
    body: 'Every bank partner gets a fully branded diagnostic experience — their colours, logo, and domain, all powered by the BizReady engine.',
    cta1: { label: 'See pricing', href: '#pricing', signup: false },
    cta2: { label: 'How it works', href: '#how-it-works' },
    bg: 'linear-gradient(135deg, #0C3547 0%, #0284C7 55%, #0F6E56 100%)',
    accent: '#6EE7B7',
  },
  {
    eyebrow: 'TA Programme',
    headline: ['From Diagnostic\nto ', 'Investment-Ready', '\nin 8 Weeks'],
    body: "InnoSL's TA programme turns every capacity gap into an actionable improvement plan. Most SMEs reach Investment Ready status within 8–12 weeks.",
    cta1: { label: 'View pricing', href: '#pricing', signup: false },
    cta2: { label: 'Learn more', href: '#how-it-works' },
    bg: 'linear-gradient(135deg, #0F2D22 0%, #0F6E56 55%, #3B1270 100%)',
    accent: '#FCD34D',
  },
]

// ── Feature SVG icons ────────────────────────────────────
function IconIndex({ c }: { c: string }) {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="12" width="4" height="9" rx="1"/>
      <rect x="9" y="8" width="4" height="13" rx="1"/>
      <rect x="16" y="3" width="4" height="18" rx="1"/>
      <polyline points="3,9 8,6 13,8 18,2"/>
      <circle cx="18" cy="2" r="1.5" fill={c} stroke="none"/>
    </svg>
  )
}
function IconFunnel({ c }: { c: string }) {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4h18l-6.5 8.5v6l-5-2.5V12.5L3 4z"/>
      <line x1="9.5" y1="4" x2="8" y2="6.5"/>
      <line x1="15" y1="4" x2="17" y2="6.5"/>
    </svg>
  )
}
function IconWhiteLabel({ c }: { c: string }) {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18"/>
      <path d="M3 10.5h18"/>
      <path d="M5 7l7-4 7 4"/>
      <path d="M4 10.5V21"/>
      <path d="M20 10.5V21"/>
      <rect x="9" y="14" width="6" height="7" rx="0.5"/>
      <path d="M7 14v3"/>
      <path d="M17 14v3"/>
    </svg>
  )
}
function IconCMS({ c }: { c: string }) {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3"/>
      <path d="M3 5v5c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/>
      <path d="M3 10v6c0 1.66 4.03 3 9 3s9-1.34 9-3v-6"/>
      <path d="M16 17.5l2 2 3-3"/>
    </svg>
  )
}
function IconTA({ c }: { c: string }) {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
      <rect x="9" y="3" width="6" height="4" rx="1"/>
      <path d="M9 12l2 2 4-4"/>
      <line x1="9" y1="17" x2="13" y2="17"/>
    </svg>
  )
}
function IconEmail({ c }: { c: string }) {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <polyline points="2,7 12,14 22,7"/>
      <path d="M17 1l-2 3.5h3L16 8"/>
    </svg>
  )
}
function IconPDF({ c }: { c: string }) {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14,2 14,8 20,8"/>
      <polyline points="7,15 9,13 11,16 13,11 16,15"/>
    </svg>
  )
}
function IconDashboard({ c }: { c: string }) {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
      <polyline points="5,13 8,10 11,12 15,7 19,10"/>
    </svg>
  )
}

// ── Features ──────────────────────────────────────────────
const FEATURES = [
  { Icon: IconIndex,      iconColor: P,  title: 'Investment Readiness Index',    desc: 'A weighted scoring algorithm (Strategic 30% · Operational 45% · Support 25%) that produces a single 0–100 score reflecting real business health.', bg: PL },
  { Icon: IconFunnel,     iconColor: BD, title: 'Visual Capacity Funnel',        desc: 'A diagnostic funnel showing exactly which capacity layer — strategic, operational, or support — is the bottleneck holding a business back.', bg: BL },
  { Icon: IconWhiteLabel, iconColor: P,  title: 'White-Label for Any Bank',      desc: 'Each bank gets a fully branded portal with their own colours, logo, and domain. All powered by the BizReady engine underneath.', bg: PL },
  { Icon: IconCMS,        iconColor: BD, title: 'Question Bank CMS',             desc: 'Manage all diagnostic questions, scoring weights, and section limits from a built-in CMS. Import via CSV or Excel — changes publish instantly.', bg: BL },
  { Icon: IconTA,         iconColor: P,  title: 'TA Programme Tracker',          desc: 'Every gap identified generates a personalised Technical Assistance plan. Banks and SMEs track progress together in real time.', bg: PL },
  { Icon: IconEmail,      iconColor: BD, title: 'Automated Result Emails',       desc: 'Every SME receives their Investment Readiness Index, capacity breakdown, and TA recommendations by email within seconds of submission.', bg: BL },
  { Icon: IconPDF,        iconColor: P,  title: 'PDF Bank Reports',              desc: 'One click generates a full bank-ready diagnostic report — pre-formatted with BizReady branding, scoring methodology, and recommendations.', bg: PL },
  { Icon: IconDashboard,  iconColor: BD, title: 'SME Progress Dashboard',        desc: 'SMEs see all their diagnostic history, TA progress, score trends over time, and projected score after completing all improvements.', bg: BL },
]

const CARD_GAP = 20

// ── Banks ─────────────────────────────────────────────────
const BANKS = [
  { name: 'UBA Sierra Leone',      abbr: 'UBA',  color: '#C8102E' },
  { name: 'SL Commercial Bank',    abbr: 'SLCB', color: '#8B0000' },
  { name: 'Rokel Commercial Bank', abbr: 'RCB',  color: '#DAA520' },
  { name: 'Vista Bank SL',         abbr: 'VSB',  color: '#C8102E' },
  { name: 'GTBank Sierra Leone',   abbr: 'GTB',  color: '#F68B1F' },
  { name: 'Ecobank Ghana',         abbr: 'ECO',  color: '#009A44' },
  { name: 'Access Bank Liberia',   abbr: 'ACC',  color: '#E87722' },
  { name: 'BRAC Sierra Leone',     abbr: 'BRC',  color: '#E41E26' },
  { name: 'IFC / World Bank',      abbr: 'IFC',  color: '#003F6B' },
  { name: 'African Dev. Bank',     abbr: 'AfDB', color: '#007DC3' },
  { name: 'Zenith Bank SL',        abbr: 'ZBSL', color: '#841D4D' },
  { name: 'InnovationSL',          abbr: 'ISL',  color: P },
]

// ── Steps ─────────────────────────────────────────────────
const STEPS = [
  { num: '01', title: 'Bank subscribes',     desc: 'A bank signs up, configures their brand theme, and gets a unique diagnostic link in minutes.' },
  { num: '02', title: 'SME takes diagnostic', desc: 'The bank shares the link with SME clients. Each SME completes the 8-minute diagnostic on any device.' },
  { num: '03', title: 'Instant scoring',     desc: 'The Investment Readiness Index is calculated automatically. Results are emailed within seconds.' },
  { num: '04', title: 'Bank reviews report', desc: "The bank's relationship manager sees the full diagnostic on their dashboard and generates a one-click report." },
  { num: '05', title: 'TA programme starts', desc: 'InnoSL activates a Technical Assistance plan targeting identified gaps, tracked by both SME and bank.' },
  { num: '06', title: 'Rescore & approve',   desc: 'After TA, the SME retakes the diagnostic. Most reach Investment Ready status within 8–12 weeks.' },
]

// ── Plans ─────────────────────────────────────────────────
const PLANS = [
  {
    name: 'Starter', price: '$299', period: '/month',
    desc: 'For community banks and microfinance institutions getting started.',
    features: ['50 diagnostics per month', 'Automated email results', 'Basic bank dashboard', 'Standard scoring engine', 'Email support'],
    cta: 'Get started', popular: false,
  },
  {
    name: 'Growth', price: '$899', period: '/month',
    desc: 'For national banks running active SME lending programmes.',
    features: ['Unlimited diagnostics', 'White-label branding & custom domain', 'Full analytics dashboard', 'TA programme tracker', 'PDF bank reports', 'CSV/Excel question bank import', 'Priority support'],
    cta: 'Start free trial', popular: true,
  },
  {
    name: 'Enterprise', price: '$2,500', period: '/month',
    desc: 'For regional and international banks across multiple countries.',
    features: ['Everything in Growth', 'Multi-country deployment', 'Custom scoring weights per country', 'Full API access', 'Dedicated success manager', 'SLA guarantee (99.9% uptime)', 'White-glove onboarding'],
    cta: 'Contact sales', popular: false,
  },
]

const FAQS = [
  { q: 'How long does the diagnostic take?', a: 'The diagnostic takes approximately 8–10 minutes to complete. Progress is saved automatically so SMEs can pause and return at any time.' },
  { q: 'Do SMEs need to create an account?', a: 'No — SMEs can complete the diagnostic via a link shared by their bank without creating an account. They only need to register to access their personal progress dashboard.' },
  { q: 'Can we customise the questions?', a: 'Yes. InnoSL manages the master question bank via a built-in CMS. Banks on Growth and Enterprise plans can request custom sections. Questions can be imported in bulk via CSV or Excel.' },
  { q: 'How is the Investment Readiness Index calculated?', a: 'The index uses a weighted formula: Strategic capacity (30%) + Operational capacity (45%) + Support capacity (25%). Each section is scored based on question responses, normalised to 0–100%, then multiplied by its weight.' },
  { q: 'Is the data secure and confidential?', a: "Yes. All data is encrypted in transit and at rest. Each bank's data is fully isolated — no bank can see another bank's SME data." },
  { q: 'Can we deploy under our own domain?', a: 'Yes — Growth and Enterprise plans support custom domains, so SMEs see your bank domain instead of bizready.io.' },
]

// ── Hero SVG visuals ──────────────────────────────────────

function Visual1() {
  return (
    <svg viewBox="0 0 480 360" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', maxWidth: 480, filter: 'drop-shadow(0 24px 64px rgba(0,0,0,0.45))' }}>
      <rect width="480" height="360" rx="20" fill="rgba(255,255,255,0.07)" />
      <rect width="480" height="44" rx="20" fill="rgba(255,255,255,0.13)" />
      <rect y="24" width="480" height="20" fill="rgba(255,255,255,0.13)" />
      <circle cx="24" cy="22" r="7" fill="#FF5F57" /><circle cx="46" cy="22" r="7" fill="#FFBD2E" /><circle cx="68" cy="22" r="7" fill="#28C840" />
      <text x="240" y="28" textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="11" fontFamily="system-ui">BizReady — Investment Dashboard</text>
      <rect x="20" y="60" width="200" height="160" rx="14" fill="rgba(255,255,255,0.09)" />
      <text x="120" y="86" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="9" fontFamily="system-ui" letterSpacing="1.5">READINESS SCORE</text>
      <path d="M 58 158 A 62 62 0 0 1 182 158" stroke="rgba(255,255,255,0.12)" strokeWidth="10" strokeLinecap="round" fill="none" />
      <path d="M 58 158 A 62 62 0 0 1 166 108" stroke="#6EE7B7" strokeWidth="10" strokeLinecap="round" fill="none" />
      <text x="120" y="147" textAnchor="middle" fill="white" fontSize="38" fontWeight="800" fontFamily="system-ui">78</text>
      <text x="120" y="165" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="10" fontFamily="system-ui">out of 100</text>
      <rect x="68" y="172" width="104" height="22" rx="11" fill="rgba(110,231,183,0.18)" />
      <text x="120" y="187" textAnchor="middle" fill="#6EE7B7" fontSize="9" fontFamily="system-ui" fontWeight="700">● Investment Ready</text>
      <rect x="236" y="60" width="224" height="160" rx="14" fill="rgba(255,255,255,0.09)" />
      <text x="252" y="84" fill="rgba(255,255,255,0.45)" fontSize="9" fontFamily="system-ui" letterSpacing="1.5">CAPACITY BREAKDOWN</text>
      {[
        { label: 'Strategic', pct: 82, w: 134, color: '#818CF8', y: 100 },
        { label: 'Operational', pct: 71, w: 116, color: '#7DD3FC', y: 130 },
        { label: 'Support', pct: 68, w: 110, color: '#6EE7B7', y: 160 },
      ].map(b => (
        <g key={b.label}>
          <text x="252" y={b.y - 4} fill="rgba(255,255,255,0.65)" fontSize="10" fontFamily="system-ui">{b.label}</text>
          <text x="448" y={b.y - 4} textAnchor="end" fill="rgba(255,255,255,0.65)" fontSize="10" fontFamily="system-ui">{b.pct}%</text>
          <rect x="252" y={b.y} width="164" height="7" rx="3.5" fill="rgba(255,255,255,0.1)" />
          <rect x="252" y={b.y} width={b.w} height="7" rx="3.5" fill={b.color} />
        </g>
      ))}
      {[
        { x: 20,  label: 'DIAGNOSTICS', val: '5,241', sub: '↑ +12%', subColor: '#6EE7B7' },
        { x: 172, label: 'PARTNERS',    val: '12',    sub: 'West Africa', subColor: '#7DD3FC' },
        { x: 324, label: 'READY RATE',  val: '67%',   sub: 'After TA', subColor: '#FCD34D' },
      ].map(s => (
        <g key={s.label}>
          <rect x={s.x} y="236" width="136" height="108" rx="14" fill="rgba(255,255,255,0.09)" />
          <text x={s.x + 16} y="260" fill="rgba(255,255,255,0.4)" fontSize="8" fontFamily="system-ui" letterSpacing="1">{s.label}</text>
          <text x={s.x + 16} y="294" fill="white" fontSize="30" fontWeight="800" fontFamily="system-ui">{s.val}</text>
          <text x={s.x + 16} y="314" fill={s.subColor} fontSize="9" fontFamily="system-ui">{s.sub}</text>
        </g>
      ))}
    </svg>
  )
}

function Visual2() {
  return (
    <svg viewBox="0 0 480 360" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', maxWidth: 480, filter: 'drop-shadow(0 24px 64px rgba(0,0,0,0.45))' }}>
      <rect width="480" height="360" rx="20" fill="rgba(255,255,255,0.07)" />
      <rect width="480" height="44" rx="20" fill="rgba(255,255,255,0.13)" />
      <rect y="24" width="480" height="20" fill="rgba(255,255,255,0.13)" />
      <circle cx="24" cy="22" r="7" fill="#FF5F57" /><circle cx="46" cy="22" r="7" fill="#FFBD2E" /><circle cx="68" cy="22" r="7" fill="#28C840" />
      <text x="240" y="28" textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="11" fontFamily="system-ui">BizReady — Bank Partner Portals</text>
      {[
        { x: 18,  abbr: 'UBA', sub: 'SIERRA LEONE', color: '#C8102E' },
        { x: 174, abbr: 'Eco', sub: 'GHANA',         color: '#009A44' },
        { x: 330, abbr: 'GTB', sub: 'SIERRA LEONE',  color: '#F68B1F' },
      ].map(b => (
        <g key={b.abbr}>
          <rect x={b.x} y="58" width="138" height="290" rx="16" fill="rgba(255,255,255,0.06)" stroke={`${b.color}55`} strokeWidth="1" />
          <rect x={b.x} y="58" width="138" height="56" rx="16" fill={`${b.color}99`} />
          <rect x={b.x} y="94" width="138" height="20" fill={`${b.color}99`} />
          <text x={b.x + 69} y="86" textAnchor="middle" fill="white" fontSize="14" fontWeight="800" fontFamily="system-ui">{b.abbr}</text>
          <text x={b.x + 69} y="103" textAnchor="middle" fill="rgba(255,255,255,0.65)" fontSize="8" fontFamily="system-ui">{b.sub}</text>
          <rect x={b.x + 14} y="130" width="110" height="9" rx="4.5" fill="rgba(255,255,255,0.15)" />
          <rect x={b.x + 14} y="148" width="80" height="9" rx="4.5" fill="rgba(255,255,255,0.15)" />
          <rect x={b.x + 14} y="170" width="110" height="30" rx="8" fill="rgba(255,255,255,0.1)" />
          <rect x={b.x + 14} y="210" width="110" height="30" rx="8" fill="rgba(255,255,255,0.1)" />
          <rect x={b.x + 14} y="250" width="110" height="30" rx="8" fill="rgba(255,255,255,0.1)" />
          <rect x={b.x + 14} y="296" width="110" height="34" rx="10" fill={`${b.color}cc`} />
          <text x={b.x + 69} y="318" textAnchor="middle" fill="white" fontSize="10" fontWeight="700" fontFamily="system-ui">Start Diagnostic</text>
        </g>
      ))}
    </svg>
  )
}

function Visual3() {
  const steps = [
    { x: 40,  label: 'Diagnostic', sub: 'Score: 48%', done: true,  nodeColor: '#6EE7B7', lineColor: '#6EE7B7' },
    { x: 120, label: 'TA Started', sub: 'Week 1',     done: true,  nodeColor: '#6EE7B7', lineColor: '#6EE7B7' },
    { x: 200, label: 'Strategic',  sub: 'Week 3',     done: true,  nodeColor: '#6EE7B7', lineColor: '#FCD34D' },
    { x: 280, label: 'Operational',sub: 'Week 6',     done: false, nodeColor: '#FCD34D', lineColor: 'rgba(255,255,255,0.15)' },
    { x: 360, label: 'Rescore',    sub: 'Week 9',     done: false, nodeColor: 'rgba(255,255,255,0.25)', lineColor: 'rgba(255,255,255,0.15)' },
    { x: 440, label: 'Approved',   sub: 'Week 12',    done: false, nodeColor: 'rgba(255,255,255,0.25)', lineColor: null },
  ]
  return (
    <svg viewBox="0 0 480 360" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', maxWidth: 480, filter: 'drop-shadow(0 24px 64px rgba(0,0,0,0.45))' }}>
      <rect width="480" height="360" rx="20" fill="rgba(255,255,255,0.07)" />
      <rect width="480" height="44" rx="20" fill="rgba(255,255,255,0.13)" />
      <rect y="24" width="480" height="20" fill="rgba(255,255,255,0.13)" />
      <circle cx="24" cy="22" r="7" fill="#FF5F57" /><circle cx="46" cy="22" r="7" fill="#FFBD2E" /><circle cx="68" cy="22" r="7" fill="#28C840" />
      <text x="240" y="28" textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="11" fontFamily="system-ui">BizReady — TA Programme Tracker</text>
      <rect x="18" y="60" width="444" height="56" rx="14" fill="rgba(110,231,183,0.14)" stroke="rgba(110,231,183,0.4)" strokeWidth="1" />
      <text x="36" y="84" fill="#6EE7B7" fontSize="11" fontWeight="700" fontFamily="system-ui">SME on track for Investment Ready status</text>
      <text x="36" y="102" fill="rgba(255,255,255,0.55)" fontSize="10" fontFamily="system-ui">Current: 63% → Projected: 78% · Est. Week 10</text>
      <rect x="372" y="68" width="74" height="40" rx="10" fill="rgba(110,231,183,0.25)" />
      <text x="409" y="88" textAnchor="middle" fill="#6EE7B7" fontSize="11" fontWeight="800" fontFamily="system-ui">+30 pts</text>
      <text x="409" y="102" textAnchor="middle" fill="rgba(110,231,183,0.65)" fontSize="8" fontFamily="system-ui">projected</text>
      <line x1="40" y1="164" x2="440" y2="164" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
      {steps.map((s, i) => (
        <g key={i}>
          {s.lineColor && i > 0 && <line x1={s.x - 80} y1="164" x2={s.x} y2="164" stroke={s.lineColor} strokeWidth="2.5" />}
          <circle cx={s.x} cy="164" r="14" fill={s.done ? s.nodeColor : 'rgba(255,255,255,0.08)'} stroke={s.nodeColor} strokeWidth="2" />
          {s.done
            ? <text x={s.x} y="169" textAnchor="middle" fill="#065F46" fontSize="13" fontWeight="700" fontFamily="system-ui">✓</text>
            : <circle cx={s.x} cy="164" r="5" fill={s.nodeColor} />}
          <text x={s.x} y="192" textAnchor="middle" fill="rgba(255,255,255,0.75)" fontSize="9" fontFamily="system-ui">{s.label}</text>
          <text x={s.x} y="205" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="8" fontFamily="system-ui">{s.sub}</text>
        </g>
      ))}
      <rect x="18" y="220" width="222" height="122" rx="14" fill="rgba(255,255,255,0.08)" />
      <text x="34" y="244" fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="system-ui" letterSpacing="1.2">SCORE TREND</text>
      {[
        { x: 54, h: 38, score: '48', color: '#F87171' },
        { x: 94, h: 52, score: '54', color: '#FCD34D' },
        { x: 134, h: 60, score: '63', color: '#FCD34D' },
        { x: 174, h: 76, score: '78', color: '#6EE7B7' },
        { x: 214, h: 20, score: '?',  color: 'rgba(255,255,255,0.15)' },
      ].map((bar, i) => (
        <g key={i}>
          <rect x={bar.x - 14} y={318 - bar.h} width="28" height={bar.h} rx="4" fill={bar.color} fillOpacity="0.75" />
          <text x={bar.x} y="332" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="system-ui">{bar.score}</text>
        </g>
      ))}
      <rect x="256" y="220" width="206" height="122" rx="14" fill="rgba(255,255,255,0.08)" />
      <text x="272" y="244" fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="system-ui" letterSpacing="1.2">TA TASKS</text>
      {[
        { task: 'Business plan review',    done: true },
        { task: 'Financial records audit', done: true },
        { task: 'Cash flow management',    done: false },
        { task: 'Governance framework',    done: false },
      ].map((t, i) => (
        <g key={i}>
          <rect x="272" y={258 + i * 22} width="13" height="13" rx="3" fill={t.done ? '#6EE7B7' : 'rgba(255,255,255,0.1)'} />
          {t.done && <text x="278.5" y={269 + i * 22} fill="#065F46" fontSize="9" fontFamily="system-ui">✓</text>}
          <text x="293" y={269 + i * 22} fill={t.done ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.85)'} fontSize="9.5" fontFamily="system-ui">{t.task}</text>
        </g>
      ))}
    </svg>
  )
}

const VISUALS = [Visual1, Visual2, Visual3]

// ── CTA button ────────────────────────────────────────────
function CTAButton({ label, style }: { label: string; style: React.CSSProperties }) {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  if (isLoaded && user) {
    return <button onClick={() => router.push('/onboarding')} style={{ ...style, border: 'none', cursor: 'pointer' }}>{label}</button>
  }
  return (
    <SignUpButton mode="modal">
      <button style={{ ...style, border: 'none', cursor: 'pointer' }}>{label}</button>
    </SignUpButton>
  )
}

// ── Main ──────────────────────────────────────────────────
export default function LandingPage() {
  const [heroIdx, setHeroIdx]           = useState(0)
  const [featIdx, setFeatIdx]           = useState(0)
  const [openFaq, setOpenFaq]           = useState<number | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [visibleCols, setVisibleCols]   = useState(3)
  const pauseHero                       = useRef(false)
  const trackRef                        = useRef<HTMLDivElement>(null)

  // Detect screen width → visible columns
  useEffect(() => {
    function update() {
      const w = window.innerWidth
      setVisibleCols(w < 640 ? 1 : w < 1024 ? 2 : 3)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // Hero auto-advance
  useEffect(() => {
    const id = setInterval(() => {
      if (!pauseHero.current) setHeroIdx(i => (i + 1) % 3)
    }, 5000)
    return () => clearInterval(id)
  }, [])

  // Features auto-advance — resets when visibleCols changes
  useEffect(() => {
    const maxIdx = Math.max(0, FEATURES.length - visibleCols)
    const id = setInterval(() => setFeatIdx(i => (i >= maxIdx ? 0 : i + 1)), 3500)
    return () => clearInterval(id)
  }, [visibleCols])

  // Scroll carousel track when featIdx changes
  useEffect(() => {
    if (!trackRef.current) return
    const card = trackRef.current.children[featIdx] as HTMLElement
    if (card) trackRef.current.scrollTo({ left: card.offsetLeft, behavior: 'smooth' })
  }, [featIdx])

  const slide  = SLIDES[heroIdx]
  const Visual = VISUALS[heroIdx]
  const ticker = [...BANKS, ...BANKS]
  const maxFeatIdx = Math.max(0, FEATURES.length - visibleCols)

  return (
    <div style={{ fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Inter', system-ui, sans-serif", color: '#1F1535', background: '#fff' }}>

      {/* ── Global styles + responsive ── */}
      <style>{`
        /* Keyframes */
        @keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        .ticker-track { animation: ticker 30s linear infinite; }
        .ticker-track:hover { animation-play-state: paused; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .slide-in { animation: fadeUp 0.5s ease forwards; }

        /* Nav hover */
        .nav-link:hover { background:#F5F3FF !important; color:#5B1FA8 !important; }

        /* Features carousel — always 3 columns */
        .feat-track { display:flex; gap:${CARD_GAP}px; overflow-x:hidden; scroll-behavior:smooth; }
        .feat-card  { flex-shrink:0; width:calc(33.333% - ${Math.ceil(CARD_GAP * 2 / 3)}px); min-width:0; }

        /* Layout grids */
        .hero-grid    { display:grid; grid-template-columns:1fr 1fr; gap:64px; align-items:center; }
        .hero-svg     { display:flex; justify-content:center; align-items:center; }
        .steps-grid   { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
        .pricing-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
        .about-grid   { max-width:1000px; margin:0 auto; display:grid; grid-template-columns:1fr 1fr; gap:64px; align-items:center; }
        .footer-grid  { display:grid; grid-template-columns:2fr 1fr 1fr 1fr; gap:40px; margin-bottom:48px; }

        /* Section padding */
        .sec-pad   { padding:96px 32px; }
        .hero-pad  { padding:88px 56px 100px; width:100%; }
        .hero-ctas { display:flex; gap:12px; flex-wrap:wrap; }

        /* Tablet */
        @media (max-width:1024px) {
          .feat-card  { width:calc(50% - ${Math.ceil(CARD_GAP / 2)}px); }
          .steps-grid { grid-template-columns:repeat(2,1fr); }
          .footer-grid { grid-template-columns:1fr 1fr; gap:28px; }
          .hero-pad   { padding:64px 32px 80px; }
          .sec-pad    { padding:72px 24px; }
        }

        /* Mobile */
        @media (max-width:768px) {
          .nav-desktop { display:none !important; }
          .nav-hamburger { display:flex !important; }
          .hero-grid  { grid-template-columns:1fr; gap:0; }
          .hero-svg   { display:none; }
          .hero-pad   { padding:48px 20px 60px; }
          .hero-h1    { font-size:32px !important; letter-spacing:-0.5px !important; line-height:1.2 !important; }
          .hero-body  { font-size:15px !important; }
          .feat-card  { width:100%; }
          .steps-grid { grid-template-columns:1fr; }
          .pricing-grid { grid-template-columns:1fr; max-width:420px; margin-left:auto; margin-right:auto; }
          .about-grid { grid-template-columns:1fr; gap:32px; }
          .footer-grid { grid-template-columns:1fr 1fr; gap:24px; }
          .sec-pad    { padding:56px 20px; }
          .cta-h2     { font-size:28px !important; }
          .hide-mobile { display:none !important; }
        }

        @media (max-width:480px) {
          .hero-h1    { font-size:26px !important; }
          .hero-ctas  { flex-direction:column; }
          .hero-ctas > * { width:100% !important; text-align:center !important; box-sizing:border-box; }
          .footer-grid { grid-template-columns:1fr; }
          .pricing-grid { max-width:100%; }
        }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,255,255,0.88)', backdropFilter: 'saturate(180%) blur(20px)', WebkitBackdropFilter: 'saturate(180%) blur(20px)', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: P, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>B</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: PD, letterSpacing: -0.3 }}>BizReady</span>
            <span className="hide-mobile" style={{ fontSize: 10, color: '#bbb', marginLeft: 2 }}>by Innovation SL</span>
          </div>

          {/* Desktop links */}
          <div className="nav-desktop" style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {NAV.map(n =>
              n.isPage
                ? <Link key={n.label} href={n.href} className="nav-link" style={{ fontSize: 13, color: '#444', textDecoration: 'none', fontWeight: 500, padding: '8px 14px', borderRadius: 8, transition: 'all 0.15s' }}>{n.label}</Link>
                : <a key={n.label} href={n.href} className="nav-link" style={{ fontSize: 13, color: '#444', textDecoration: 'none', fontWeight: 500, padding: '8px 14px', borderRadius: 8, transition: 'all 0.15s' }}>{n.label}</a>
            )}
            <div style={{ marginLeft: 10 }}><AuthButtons /></div>
          </div>

          {/* Hamburger */}
          <button
            className="nav-hamburger"
            onClick={() => setMobileMenuOpen(m => !m)}
            style={{ display: 'none', flexDirection: 'column', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}
          >
            {[0, 1, 2].map(i => (
              <span key={i} style={{ display: 'block', width: 22, height: 2, background: mobileMenuOpen && i === 1 ? 'transparent' : '#333', borderRadius: 2, transition: 'transform 0.2s', transform: mobileMenuOpen ? (i === 0 ? 'translateY(7px) rotate(45deg)' : i === 2 ? 'translateY(-7px) rotate(-45deg)' : 'none') : 'none' }} />
            ))}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div style={{ background: '#fff', borderTop: '0.5px solid #EDE9FE', padding: '8px 20px 20px' }}>
            {NAV.map(n =>
              n.isPage
                ? <Link key={n.label} href={n.href} onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', padding: '13px 4px', fontSize: 16, color: '#333', textDecoration: 'none', fontWeight: 500, borderBottom: '0.5px solid #F5F3FF' }}>{n.label}</Link>
                : <a key={n.label} href={n.href} onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', padding: '13px 4px', fontSize: 16, color: '#333', textDecoration: 'none', fontWeight: 500, borderBottom: '0.5px solid #F5F3FF' }}>{n.label}</a>
            )}
            <div style={{ marginTop: 16 }}><AuthButtons /></div>
          </div>
        )}
      </nav>

      {/* ── HERO CAROUSEL ── */}
      <section
        style={{ background: slide.bg, minHeight: 560, display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden', transition: 'background 0.9s ease' }}
        onMouseEnter={() => { pauseHero.current = true }}
        onMouseLeave={() => { pauseHero.current = false }}
      >
        <div style={{ position: 'absolute', top: -120, right: -120, width: 560, height: 560, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -160, left: -80, width: 440, height: 440, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />

        <div className="hero-grid hero-pad" style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Text */}
          <div key={`t${heroIdx}`} className="slide-in">
            <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.12)', borderRadius: 20, padding: '5px 16px', fontSize: 12, color: slide.accent, fontWeight: 600, marginBottom: 22, border: '0.5px solid rgba(255,255,255,0.2)' }}>
              {slide.eyebrow}
            </div>
            <h1 className="hero-h1" style={{ fontSize: 52, fontWeight: 800, color: '#fff', lineHeight: 1.1, margin: '0 0 20px', letterSpacing: -1.2, whiteSpace: 'pre-line' }}>
              {slide.headline[0]}
              <span style={{ color: slide.accent }}>{slide.headline[1]}</span>
              {slide.headline[2]}
            </h1>
            <p className="hero-body" style={{ fontSize: 17, color: 'rgba(255,255,255,0.72)', lineHeight: 1.68, maxWidth: 480, margin: '0 0 32px' }}>
              {slide.body}
            </p>
            <div className="hero-ctas">
              {slide.cta1.signup
                ? <CTAButton label={slide.cta1.label} style={{ padding: '14px 28px', borderRadius: 11, background: '#fff', color: P, fontWeight: 700, fontSize: 15, letterSpacing: -0.2 }} />
                : <a href={(slide.cta1 as { href: string }).href} style={{ padding: '14px 28px', borderRadius: 11, background: '#fff', color: P, fontWeight: 700, fontSize: 15, textDecoration: 'none', letterSpacing: -0.2 }}>{slide.cta1.label}</a>
              }
              <a href={slide.cta2.href} style={{ padding: '14px 28px', borderRadius: 11, background: 'rgba(255,255,255,0.10)', color: '#fff', fontWeight: 600, fontSize: 15, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.25)', letterSpacing: -0.2 }}>
                {slide.cta2.label}
              </a>
            </div>
          </div>

          {/* Visual (hidden on mobile via CSS) */}
          <div key={`v${heroIdx}`} className="hero-svg slide-in">
            <Visual />
          </div>
        </div>

        {/* Arrows */}
        {([['‹', -1], ['›', 1]] as [string, number][]).map(([ch, dir]) => (
          <button key={ch} onClick={() => setHeroIdx(i => (i + dir + 3) % 3)}
            style={{ position: 'absolute', [dir === -1 ? 'left' : 'right']: 14, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, width: 40, height: 40, cursor: 'pointer', color: '#fff', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {ch}
          </button>
        ))}

        {/* Dots */}
        <div style={{ position: 'absolute', bottom: 22, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8 }}>
          {[0, 1, 2].map(i => (
            <button key={i} onClick={() => setHeroIdx(i)}
              style={{ width: i === heroIdx ? 28 : 8, height: 8, borderRadius: 4, border: 'none', cursor: 'pointer', background: i === heroIdx ? '#fff' : 'rgba(255,255,255,0.33)', transition: 'all 0.3s ease', padding: 0 }} />
          ))}
        </div>
      </section>

      {/* ── Stats band ── */}
      <section style={{ borderTop: '0.5px solid #F0EDF8', borderBottom: '0.5px solid #F0EDF8', background: '#FAFAF8', padding: '18px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap' }}>
          {[['5,000+','Diagnostics completed'],['12','Bank partners'],['West Africa','Coverage'],['8 min','Avg completion']].map(([v, l]) => (
            <div key={l} style={{ textAlign: 'center', padding: '8px 16px' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: PD, letterSpacing: -0.4 }}>{v}</div>
              <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES CAROUSEL — always 3 cols ── */}
      <section id="features" className="sec-pad" style={{ background: '#fff', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: BD, letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 12 }}>Platform Features</p>
            <h2 style={{ fontSize: 38, fontWeight: 800, color: PD, margin: '0 0 14px', letterSpacing: -0.8 }}>Everything your bank needs</h2>
            <p style={{ fontSize: 15, color: '#666', maxWidth: 500, margin: '0 auto', lineHeight: 1.65 }}>A complete end-to-end system — from the SME filling in a form to the bank officer approving a loan.</p>
          </div>

          <div style={{ position: 'relative' }}>
            {/* Track */}
            <div ref={trackRef} className="feat-track">
              {FEATURES.map(f => (
                <div key={f.title} className="feat-card" style={{ padding: '28px 24px 24px', borderRadius: 18, border: '0.5px solid #EDE9FE', background: '#FDFCFF', boxShadow: '0 2px 14px rgba(91,31,168,0.05)', boxSizing: 'border-box' }}>
                  {/* Icon — centered */}
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
                    <div style={{ width: 60, height: 60, borderRadius: 18, background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 14px ${f.iconColor}22` }}>
                      <f.Icon c={f.iconColor} />
                    </div>
                  </div>
                  <h3 style={{ fontSize: 14.5, fontWeight: 700, color: PD, margin: '0 0 8px', letterSpacing: -0.2 }}>{f.title}</h3>
                  <p style={{ fontSize: 13, color: '#666', lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
                </div>
              ))}
            </div>

            {/* Navigation */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 28, alignItems: 'center' }}>
              <button onClick={() => setFeatIdx(i => Math.max(0, i - 1))}
                style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${PL}`, background: '#fff', cursor: 'pointer', fontSize: 18, color: P, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
              {Array.from({ length: maxFeatIdx + 1 }).map((_, i) => (
                <button key={i} onClick={() => setFeatIdx(i)}
                  style={{ width: i === featIdx ? 24 : 8, height: 8, borderRadius: 4, border: 'none', background: i === featIdx ? P : '#D8D0F0', cursor: 'pointer', padding: 0, transition: 'all 0.3s' }} />
              ))}
              <button onClick={() => setFeatIdx(i => Math.min(maxFeatIdx, i + 1))}
                style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${PL}`, background: '#fff', cursor: 'pointer', fontSize: 18, color: P, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="sec-pad" style={{ background: '#FAFAF8' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: BD, letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 12 }}>How it works</p>
            <h2 style={{ fontSize: 38, fontWeight: 800, color: PD, margin: '0 0 14px', letterSpacing: -0.8 }}>From form to loan in 6 steps</h2>
          </div>
          <div className="steps-grid">
            {STEPS.map((step, i) => (
              <div key={step.num} style={{ background: '#fff', borderRadius: 18, padding: '24px', border: '0.5px solid #EDE9FE', boxShadow: '0 1px 8px rgba(91,31,168,0.04)' }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: i % 2 === 0 ? P : BD, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, marginBottom: 14 }}>{step.num}</div>
                <h3 style={{ fontSize: 14.5, fontWeight: 700, color: PD, margin: '0 0 8px' }}>{step.title}</h3>
                <p style={{ fontSize: 13, color: '#666', lineHeight: 1.65, margin: 0 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BANK PARTNERS TICKER ── */}
      <section id="partners" className="sec-pad" style={{ background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center', marginBottom: 48 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: BD, letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 12 }}>Bank Partners</p>
          <h2 style={{ fontSize: 38, fontWeight: 800, color: PD, margin: '0 0 14px', letterSpacing: -0.8 }}>Trusted by banks across West Africa</h2>
          <p style={{ fontSize: 15, color: '#666', maxWidth: 460, margin: '0 auto', lineHeight: 1.6 }}>Each bank gets a fully white-labelled experience with their own colours, branding, and domain.</p>
        </div>
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 80, background: 'linear-gradient(to right, white, transparent)', zIndex: 2, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 80, background: 'linear-gradient(to left, white, transparent)', zIndex: 2, pointerEvents: 'none' }} />
          <div className="ticker-track" style={{ display: 'flex', gap: 14, width: 'max-content', padding: '6px 0' }}>
            {ticker.map((bank, idx) => (
              <div key={idx} style={{ minWidth: 190, padding: '16px 20px', borderRadius: 16, border: '0.5px solid #EDE9FE', background: '#FDFCFF', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.04)', flexShrink: 0 }}>
                <div style={{ width: 44, height: 44, borderRadius: 11, background: bank.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{bank.abbr}</div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: PD, margin: 0, lineHeight: 1.3 }}>{bank.name}</p>
                  <p style={{ fontSize: 10, color: '#bbb', margin: '2px 0 0' }}>Partner</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="sec-pad" style={{ background: '#FAFAF8' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: BD, letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 12 }}>Pricing</p>
            <h2 style={{ fontSize: 38, fontWeight: 800, color: PD, margin: '0 0 14px', letterSpacing: -0.8 }}>Simple, transparent pricing</h2>
            <p style={{ fontSize: 15, color: '#666' }}>Start free for 14 days. No credit card required.</p>
          </div>
          <div className="pricing-grid">
            {PLANS.map(plan => (
              <div key={plan.name} style={{ borderRadius: 20, overflow: 'hidden', border: plan.popular ? `2px solid ${P}` : '0.5px solid #EDE9FE', background: plan.popular ? P : '#fff', position: 'relative', boxShadow: plan.popular ? `0 16px 48px rgba(91,31,168,0.28)` : '0 2px 12px rgba(0,0,0,0.04)' }}>
                {plan.popular && <div style={{ position: 'absolute', top: 18, right: 18, background: '#7DD3FC', color: '#0C4A6E', fontSize: 10, fontWeight: 700, padding: '4px 12px', borderRadius: 20 }}>Most popular</div>}
                <div style={{ padding: '28px 26px 20px' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: plan.popular ? 'rgba(255,255,255,0.55)' : '#999', marginBottom: 8 }}>{plan.name}</p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 10 }}>
                    <span style={{ fontSize: 40, fontWeight: 800, color: plan.popular ? '#fff' : PD, letterSpacing: -1 }}>{plan.price}</span>
                    <span style={{ fontSize: 13, color: plan.popular ? 'rgba(255,255,255,0.45)' : '#ccc' }}>{plan.period}</span>
                  </div>
                  <p style={{ fontSize: 12.5, color: plan.popular ? 'rgba(255,255,255,0.6)' : '#777', lineHeight: 1.55, marginBottom: 20 }}>{plan.desc}</p>
                  <CTAButton label={plan.cta} style={{ display: 'block', width: '100%', textAlign: 'center', padding: '12px', borderRadius: 10, background: plan.popular ? '#fff' : P, color: plan.popular ? P : '#fff', fontWeight: 700, fontSize: 14 }} />
                </div>
                <div style={{ padding: '0 26px 26px', borderTop: `0.5px solid ${plan.popular ? 'rgba(255,255,255,0.12)' : '#F3F0FF'}`, paddingTop: 18 }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
                      <span style={{ color: plan.popular ? '#6EE7B7' : BD, fontSize: 13, flexShrink: 0, marginTop: 1 }}>✓</span>
                      <span style={{ fontSize: 12.5, color: plan.popular ? 'rgba(255,255,255,0.78)' : '#555', lineHeight: 1.5 }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section id="about" className="sec-pad" style={{ background: '#fff' }}>
        <div className="about-grid">
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: BD, letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 12 }}>About</p>
            <h2 style={{ fontSize: 34, fontWeight: 800, color: PD, margin: '0 0 18px', lineHeight: 1.15, letterSpacing: -0.6 }}>Built by Innovation SL,<br />for Sierra Leone and beyond</h2>
            <p style={{ fontSize: 14.5, color: '#555', lineHeight: 1.8, marginBottom: 14 }}>Innovation SL is an Entrepreneurship Support Organisation established in 2017 with a mission to cultivate a dynamic entrepreneurial ecosystem nurturing high-growth startups and SMEs in Sierra Leone.</p>
            <p style={{ fontSize: 14.5, color: '#555', lineHeight: 1.8, marginBottom: 26 }}>BizReady grew out of the InvestSalone Project — a World Bank-supported programme that conducted over 60 business diagnostics for Sierra Leonean SMEs.</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <a href="https://innosl.com" style={{ padding: '11px 20px', borderRadius: 10, background: P, color: '#fff', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>Visit Innovation SL →</a>
              <Link href="/contact" style={{ padding: '11px 20px', borderRadius: 10, border: `1px solid ${P}`, color: P, fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>Get in touch</Link>
            </div>
          </div>
          <div style={{ background: `linear-gradient(145deg, ${PD} 0%, ${BD} 100%)`, borderRadius: 22, padding: '32px', color: '#fff', boxShadow: `0 20px 60px rgba(91,31,168,0.28)` }}>
            <div style={{ fontSize: 30, fontWeight: 800, marginBottom: 4, letterSpacing: -0.6 }}>Innovation SL</div>
            <div style={{ fontSize: 13, color: '#C4B5FD', marginBottom: 28 }}>Creating the Future Today</div>
            {[['2017','Founded in Freetown, Sierra Leone'],['60+','SME diagnostics under InvestSalone'],['$211K','Projected annual platform revenue'],['3','Capacity levels · 12 assessment areas']].map(([val, label]) => (
              <div key={label} style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottom: '0.5px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#7DD3FC', minWidth: 52, letterSpacing: -0.5 }}>{val}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.62)', lineHeight: 1.45 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="sec-pad" style={{ background: '#FAFAF8' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 34, fontWeight: 800, color: PD, margin: '0 0 12px', letterSpacing: -0.6 }}>Frequently asked questions</h2>
          </div>
          {FAQS.map((faq, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{ width: '100%', textAlign: 'left', padding: '16px 20px', borderRadius: openFaq === i ? '12px 12px 0 0' : 12, background: '#fff', border: `0.5px solid ${openFaq === i ? P : '#EDE9FE'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: PD, letterSpacing: -0.1, marginRight: 12 }}>{faq.q}</span>
                <span style={{ fontSize: 20, color: P, transform: openFaq === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>+</span>
              </button>
              {openFaq === i && (
                <div style={{ padding: '14px 20px 18px', background: PL, borderRadius: '0 0 12px 12px', border: `0.5px solid ${P}`, borderTop: 'none' }}>
                  <p style={{ fontSize: 13.5, color: '#444', lineHeight: 1.7, margin: 0 }}>{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BAND ── */}
      <section className="sec-pad" style={{ background: `linear-gradient(135deg, ${PD} 0%, ${P} 60%, ${BD} 100%)` }}>
        <div style={{ maxWidth: 660, margin: '0 auto', textAlign: 'center' }}>
          <h2 className="cta-h2" style={{ fontSize: 38, fontWeight: 800, color: '#fff', margin: '0 0 16px', letterSpacing: -0.8, lineHeight: 1.12 }}>Ready to transform SME lending?</h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.72)', marginBottom: 34, lineHeight: 1.6 }}>Join 12 bank partners across West Africa already using BizReady to identify investment-ready SMEs faster.</p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <CTAButton label="Start free trial →" style={{ padding: '14px 30px', borderRadius: 12, background: '#fff', color: P, fontWeight: 700, fontSize: 15 }} />
            <Link href="/contact" style={{ padding: '14px 30px', borderRadius: 12, background: 'rgba(255,255,255,0.10)', color: '#fff', fontWeight: 600, fontSize: 15, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.25)' }}>Contact us →</Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: PD, padding: '52px 24px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="footer-grid">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: P, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>B</span></div>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: -0.3 }}>BizReady</span>
              </div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.42)', lineHeight: 1.7, maxWidth: 240, margin: '0 0 12px' }}>The SME Investment Readiness Platform for African banks. Powered by Innovation SL.</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>© {new Date().getFullYear()} Innovation SL. All rights reserved.</p>
            </div>

            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>Product</p>
              {[{ label: 'Features', href: '/#features' }, { label: 'How it works', href: '/#how-it-works' }, { label: 'Pricing', href: '/#pricing' }].map(l => (
                <a key={l.label} href={l.href} style={{ display: 'block', fontSize: 12.5, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: 9 }}
                  onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>{l.label}</a>
              ))}
            </div>

            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>Company</p>
              <a href="/#about" style={{ display: 'block', fontSize: 12.5, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: 9 }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>About</a>
              <Link href="/contact" style={{ display: 'block', fontSize: 12.5, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: 9 }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>Contact us</Link>
              <a href="https://innosl.com" target="_blank" rel="noreferrer" style={{ display: 'block', fontSize: 12.5, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: 9 }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>Innovation SL ↗</a>
            </div>

            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>Legal</p>
              {[{ label: 'Privacy policy', href: '/privacy' }, { label: 'Terms of service', href: '/terms' }, { label: 'Data security', href: '/security' }, { label: 'Cookie policy', href: '/cookies' }].map(l => (
                <Link key={l.label} href={l.href} style={{ display: 'block', fontSize: 12.5, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: 9 }}
                  onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>{l.label}</Link>
              ))}
            </div>
          </div>

          <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.08)', paddingTop: 20 }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: 0 }}>Built in Freetown, Sierra Leone</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
