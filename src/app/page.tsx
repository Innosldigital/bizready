'use client'
// src/app/page.tsx — Public landing page for BizReady

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { SignInButton, SignUpButton, UserButton, SignedIn, SignedOut } from '@clerk/nextjs'

const PURPLE = '#5B1FA8'
const PURPLE_DARK = '#3B1270'
const PURPLE_LIGHT = '#EDE9FE'
const BLUE = '#0EA5E9'
const BLUE_DARK = '#0284C7'
const BLUE_LIGHT = '#E0F2FE'
const GRAY = '#F8F7FF'

const NAV_LINKS = ['Features', 'How it works', 'Pricing', 'Banks', 'About', 'Contact']

const FEATURES = [
  {
    icon: '◈',
    title: 'Investment Readiness Index',
    desc: 'A weighted scoring algorithm (Strategic 30% · Operational 45% · Support 25%) that produces a single 0–100% score reflecting a business\'s readiness.',
    color: PURPLE,
  },
  {
    icon: '▲',
    title: 'Investment readiness funnel',
    desc: 'A visual funnel diagnostic that shows exactly which capacity layer — strategic, operational, or support — is the bottleneck holding a business back.',
    color: BLUE_DARK,
  },
  {
    icon: '◉',
    title: 'White-label for any bank',
    desc: 'Each bank gets a fully branded portal with their own colours, logo, and domain. UBA sees red, SLCB sees red and gold, Ecobank sees green — all powered by the BizReady engine.',
    color: PURPLE,
  },
  {
    icon: '≡',
    title: 'Question bank CMS',
    desc: 'InnoSL staff manage all diagnostic questions, scoring weights, and section limits from a built-in CMS. Import via CSV or Excel. Changes publish instantly across all bank tenants.',
    color: BLUE_DARK,
  },
  {
    icon: '□',
    title: 'TA programme tracker',
    desc: 'Every gap identified in a diagnostic automatically generates a personalised Technical Assistance plan. Banks and SMEs track progress together in real time.',
    color: PURPLE,
  },
  {
    icon: '✉',
    title: 'Automated result emails',
    desc: 'Every SME receives their Investment Readiness Index, capacity breakdown, and TA recommendations by email within seconds of submission — beautifully branded to their bank.',
    color: BLUE_DARK,
  },
  {
    icon: '↗',
    title: 'PDF bank reports',
    desc: 'One click generates a full bank-ready diagnostic report for any submission — pre-formatted with BizReady branding, scoring methodology, and recommendations.',
    color: PURPLE,
  },
  {
    icon: '○',
    title: 'SME progress dashboard',
    desc: 'SMEs log in to see all their diagnostic history, TA programme progress, score trends over time, and their projected score after completing all recommended improvements.',
    color: BLUE_DARK,
  },
]

const STEPS = [
  { num: '01', title: 'Bank subscribes',     desc: 'A bank signs up for a plan, configures their brand theme, and gets a unique diagnostic link in minutes.' },
  { num: '02', title: 'SME takes diagnostic', desc: 'The bank shares the link with their SME clients. Each SME completes the 8-minute diagnostic on any device.' },
  { num: '03', title: 'Instant scoring',      desc: 'The Investment Readiness Index is calculated automatically using the weighted formula. Results are emailed within seconds.' },
  { num: '04', title: 'Bank reviews report',  desc: 'The bank\'s relationship manager sees the full diagnostic on their dashboard and generates a one-click report.' },
  { num: '05', title: 'TA programme starts',  desc: 'InnoSL activates a Technical Assistance plan targeting the identified gaps, tracked by both SME and bank.' },
  { num: '06', title: 'Rescore & approve',    desc: 'After TA, the SME retakes the diagnostic. Most businesses reach Investment Ready status within 8–12 weeks.' },
]

const PLANS = [
  {
    name: 'Starter',
    price: '$299',
    period: '/month',
    desc: 'For community banks and microfinance institutions getting started.',
    color: PURPLE_LIGHT,
    textColor: PURPLE_DARK,
    btnStyle: 'outline',
    features: [
      '50 diagnostics per month',
      'Automated email results',
      'Basic bank dashboard',
      'Standard scoring engine',
      'Email support',
    ],
    cta: 'Get started',
    popular: false,
  },
  {
    name: 'Growth',
    price: '$899',
    period: '/month',
    desc: 'For national banks running active SME lending programmes.',
    color: PURPLE,
    textColor: '#fff',
    btnStyle: 'white',
    features: [
      'Unlimited diagnostics',
      'White-label branding & custom domain',
      'Full analytics dashboard',
      'TA programme tracker',
      'PDF bank reports',
      'CSV/Excel question bank import',
      'Priority support',
    ],
    cta: 'Start free trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: '$2,500',
    period: '/month',
    desc: 'For regional and international banks across multiple countries.',
    color: PURPLE_LIGHT,
    textColor: PURPLE_DARK,
    btnStyle: 'outline',
    features: [
      'Everything in Growth',
      'Multi-country deployment',
      'Custom scoring weights per country',
      'Full API access',
      'Dedicated success manager',
      'SLA guarantee (99.9% uptime)',
      'White-glove onboarding',
    ],
    cta: 'Contact sales',
    popular: false,
  },
]

const BANKS = [
  { name: 'UBA Sierra Leone',        abbr: 'UBA',  color: '#C8102E' },
  { name: 'SL Commercial Bank',      abbr: 'SLCB', color: '#C8102E' },
  { name: 'Rokel Commercial Bank',   abbr: 'RCB',  color: '#DAA520' },
  { name: 'Vista Bank SL',           abbr: 'VSB',  color: '#C8102E' },
  { name: 'GTBank Sierra Leone',     abbr: 'GTB',  color: '#F68B1F' },
  { name: 'Ecobank Ghana',           abbr: 'ECO',  color: '#009A44' },
  { name: 'Access Bank Liberia',     abbr: 'ACC',  color: '#E87722' },
  { name: 'BRAC Sierra Leone',       abbr: 'BRC',  color: '#E41E26' },
  { name: 'IFC / World Bank',        abbr: 'IFC',  color: '#003F6B' },
  { name: 'African Dev. Bank',       abbr: 'AfDB', color: '#007DC3' },
  { name: 'Zenith Bank SL',          abbr: 'ZBSL', color: '#841D4D' },
  { name: 'InnovationSL (Owner)',    abbr: 'ISL',  color: PURPLE },
]

const FAQS = [
  { q: 'How long does the diagnostic take?', a: 'The diagnostic takes approximately 8–10 minutes to complete. Progress is saved automatically so SMEs can pause and return at any time.' },
  { q: 'Do SMEs need to create an account?', a: 'No — SMEs can complete the diagnostic via a link shared by their bank without creating an account. They only need to register to access their personal progress dashboard.' },
  { q: 'Can we customise the questions?', a: 'Yes. InnoSL manages the master question bank via a built-in CMS. Banks on the Growth and Enterprise plans can request custom sections. Questions can also be imported in bulk via CSV or Excel.' },
  { q: 'How is the Investment Readiness Index calculated?', a: 'The index uses a weighted formula: Strategic capacity (30%) + Operational capacity (45%) + Support capacity (25%). Each section is scored based on question responses, normalised to 0–100%, then multiplied by its weight.' },
  { q: 'Is the data secure and confidential?', a: 'Yes. All data is encrypted in transit and at rest. Each bank\'s data is fully isolated — no bank can see another\'s SME data. SME data is only shared with the bank that administered the diagnostic.' },
  { q: 'Can we deploy under our own domain?', a: 'Yes — Growth and Enterprise plans support custom domains, so SMEs see your bank\'s domain (e.g. diagnostics.yourbank.com) rather than bizready.io.' },
]

// ── CTA BUTTON COMPONENT ──────────────────────────────────────
function CTAButton({ label, style }: { label: string; style: React.CSSProperties }) {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  const handleClick = () => {
    if (isLoaded && user) {
      // User is signed in — go to onboarding
      router.push('/onboarding')
    }
    // If not loaded or no user, SignUpButton will handle it
  }

  // If user is signed in, show a redirect button
  if (isLoaded && user) {
    return (
      <button
        onClick={handleClick}
        style={{ ...style, border: 'none', cursor: 'pointer' }}
      >
        {label}
      </button>
    )
  }

  // If not signed in, show the signup modal
  return (
    <SignUpButton mode="modal">
      <button style={{ ...style, border: 'none', cursor: 'pointer' }}>
        {label}
      </button>
    </SignUpButton>
  )
}

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [contactForm, setContactForm] = useState({ name: '', email: '', bank: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: '#1F1535', background: '#fff' }}>

      {/* ══ NAVBAR ══════════════════════════════════════════════ */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(255,255,255,0.96)',
        borderBottom: '0.5px solid #E9E3F8',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: PURPLE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>B</span>
              </div>
              <div>
                <span style={{ fontWeight: 700, fontSize: 17, color: PURPLE }}>BizReady</span>
                <span style={{ fontSize: 10, color: '#999', marginLeft: 6 }}>by Innovation SL</span>
              </div>
            </div>
          <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
            {NAV_LINKS.map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(' ','-')}`}
                style={{ fontSize: 13, color: '#555', textDecoration: 'none', fontWeight: 500 }}
                onMouseEnter={e => (e.currentTarget.style.color = PURPLE)}
                onMouseLeave={e => (e.currentTarget.style.color = '#555')}>
                {l}
              </a>
            ))}
            <SignedOut>
              <SignInButton mode="modal">
                <button style={{ fontSize: 13, color: '#555', textDecoration: 'none', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}>
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button style={{
                  fontSize: 13, padding: '8px 20px', borderRadius: 8,
                  background: PURPLE, color: '#fff', textDecoration: 'none', fontWeight: 500,
                  border: 'none', cursor: 'pointer'
                }}>
                  Get started
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <a href="/bank/dashboard" style={{ fontSize: 13, color: '#555', textDecoration: 'none', fontWeight: 500 }}>Dashboard</a>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </div>
      </nav>

      {/* ══ HERO ═════════════════════════════════════════════════ */}
      <section style={{ background: `linear-gradient(135deg, ${PURPLE_DARK} 0%, ${PURPLE} 50%, ${BLUE_DARK} 100%)`, padding: '80px 24px 96px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '5px 16px', fontSize: 12, color: '#C4B5FD', fontWeight: 500, marginBottom: 24, border: '0.5px solid rgba(255,255,255,0.25)' }}>
            Powered by Innovation SL · Creating the Future Today
          </div>
          <h1 style={{ fontSize: 52, fontWeight: 800, color: '#fff', lineHeight: 1.15, margin: '0 0 20px' }}>
            The SME Investment<br />
            <span style={{ color: '#7DD3FC' }}>Readiness Platform</span><br />
            for African Banks
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, maxWidth: 620, margin: '0 auto 36px' }}>
            BizReady helps banks in Sierra Leone and across West Africa assess SME loan readiness in 8 minutes — producing a weighted Investment Readiness Index, personalised TA recommendations, and bank-ready reports automatically.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <CTAButton 
              label="Start free trial →"
              style={{ padding: '14px 32px', borderRadius: 10, background: '#fff', color: PURPLE, fontWeight: 700, fontSize: 15 }}
            />
            <a href="#how-it-works" style={{ padding: '14px 32px', borderRadius: 10, background: 'rgba(255,255,255,0.12)', color: '#fff', fontWeight: 600, fontSize: 15, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.3)' }}>
              See how it works
            </a>
          </div>
          <div style={{ display: 'flex', gap: 32, justifyContent: 'center', marginTop: 48, flexWrap: 'wrap' }}>
            {[['5,000+','Diagnostics completed'],['12','Bank partners'],['West Africa','Coverage'],['8 min','Avg completion time']].map(([val, label]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 700, color: '#fff' }}>{val}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SCORE PREVIEW STRIP ══════════════════════════════════ */}
      <section style={{ background: '#FAFAFA', borderTop: '0.5px solid #EDE9FE', borderBottom: '0.5px solid #EDE9FE', padding: '28px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#888', fontWeight: 500 }}>Investment readiness classifications:</span>
          {[
            { label: 'Investment Ready', score: '≥ 80%', bg: '#E1F5EE', color: '#065F46', border: '#6EE7B7' },
            { label: 'Conditionally Lendable', score: '60–79%', bg: '#FEF3C7', color: '#92400E', border: '#FCD34D' },
            { label: 'High Risk', score: '< 60%', bg: '#FEE2E2', color: '#7F1D1D', border: '#FCA5A5' },
          ].map(c => (
            <div key={c.label} style={{ padding: '8px 20px', borderRadius: 30, background: c.bg, border: `1px solid ${c.border}`, display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: c.color }}>{c.label}</span>
              <span style={{ fontSize: 11, color: c.color, opacity: 0.75 }}>{c.score}</span>
            </div>
          ))}
          <span style={{ fontSize: 12, color: '#888' }}>Based on: Strategic (30%) + Operational (45%) + Support (25%)</span>
        </div>
      </section>

      {/* ══ FEATURES ══════════════════════════════════════════════ */}
      <section id="features" style={{ padding: '80px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: BLUE_DARK, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Platform Features</p>
            <h2 style={{ fontSize: 38, fontWeight: 800, color: PURPLE_DARK, margin: '0 0 14px' }}>Everything your bank needs</h2>
            <p style={{ fontSize: 16, color: '#666', maxWidth: 540, margin: '0 auto' }}>A complete end-to-end system — from the SME filling in a form to the bank officer approving a loan.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{ padding: '24px', borderRadius: 14, border: `0.5px solid #EDE9FE`, background: '#FDFCFF', transition: 'border-color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = PURPLE)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#EDE9FE')}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: f.color === PURPLE ? PURPLE_LIGHT : BLUE_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginBottom: 14, color: f.color }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: PURPLE_DARK, margin: '0 0 8px' }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: '#666', lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ════════════════════════════════════════ */}
      <section id="how-it-works" style={{ padding: '80px 24px', background: GRAY }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: BLUE_DARK, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>How it works</p>
            <h2 style={{ fontSize: 38, fontWeight: 800, color: PURPLE_DARK, margin: '0 0 14px' }}>From form to loan in 6 steps</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {STEPS.map((step, i) => (
              <div key={step.num} style={{ background: '#fff', borderRadius: 14, padding: '24px', border: '0.5px solid #EDE9FE', position: 'relative' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: i % 2 === 0 ? PURPLE : BLUE_DARK, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, marginBottom: 14 }}>
                  {step.num}
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: PURPLE_DARK, margin: '0 0 8px' }}>{step.title}</h3>
                <p style={{ fontSize: 13, color: '#666', lineHeight: 1.65, margin: 0 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ BANK PARTNERS ════════════════════════════════════════ */}
      <section id="banks" style={{ padding: '80px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: BLUE_DARK, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Bank Partners</p>
            <h2 style={{ fontSize: 38, fontWeight: 800, color: PURPLE_DARK, margin: '0 0 14px' }}>Trusted by banks across West Africa</h2>
            <p style={{ fontSize: 15, color: '#666', maxWidth: 500, margin: '0 auto' }}>Each bank gets a fully white-labelled experience with their own colours, branding, and domain.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
            {BANKS.map(bank => (
              <div key={bank.abbr} style={{ border: '0.5px solid #EDE9FE', borderRadius: 12, padding: '16px', textAlign: 'center', background: '#FDFCFF' }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: bank.color, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: 11, fontWeight: 700, color: '#fff' }}>
                  {bank.abbr}
                </div>
                <p style={{ fontSize: 11, fontWeight: 600, color: PURPLE_DARK, margin: 0, lineHeight: 1.3 }}>{bank.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRICING ══════════════════════════════════════════════ */}
      <section id="pricing" style={{ padding: '80px 24px', background: GRAY }}>
        <div style={{ maxWidth: 1050, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: BLUE_DARK, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Pricing</p>
            <h2 style={{ fontSize: 38, fontWeight: 800, color: PURPLE_DARK, margin: '0 0 14px' }}>Simple, transparent pricing</h2>
            <p style={{ fontSize: 15, color: '#666' }}>Start free for 14 days. No credit card required.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {PLANS.map(plan => (
              <div key={plan.name} style={{
                borderRadius: 16, overflow: 'hidden',
                border: plan.popular ? `2px solid ${PURPLE}` : '0.5px solid #EDE9FE',
                background: plan.popular ? PURPLE : '#fff',
                position: 'relative',
              }}>
                {plan.popular && (
                  <div style={{ position: 'absolute', top: 16, right: 16, background: BLUE, color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
                    Most popular
                  </div>
                )}
                <div style={{ padding: '28px 28px 20px' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: plan.popular ? 'rgba(255,255,255,0.7)' : '#888', marginBottom: 6 }}>{plan.name}</p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 10 }}>
                    <span style={{ fontSize: 38, fontWeight: 800, color: plan.popular ? '#fff' : PURPLE_DARK }}>{plan.price}</span>
                    <span style={{ fontSize: 13, color: plan.popular ? 'rgba(255,255,255,0.6)' : '#999' }}>{plan.period}</span>
                  </div>
                  <p style={{ fontSize: 12, color: plan.popular ? 'rgba(255,255,255,0.7)' : '#777', lineHeight: 1.5, marginBottom: 20 }}>{plan.desc}</p>
                  <CTAButton
                    label={plan.cta}
                    style={{
                      display: 'block', width: '100%', textAlign: 'center', padding: '11px', borderRadius: 9,
                      background: plan.popular ? '#fff' : PURPLE,
                      color: plan.popular ? PURPLE : '#fff',
                      fontWeight: 700, fontSize: 13, textDecoration: 'none'
                    }}
                  />
                </div>
                <div style={{ padding: '0 28px 28px', borderTop: `0.5px solid ${plan.popular ? 'rgba(255,255,255,0.15)' : '#F3F0FF'}`, paddingTop: 18 }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 10 }}>
                      <span style={{ color: plan.popular ? '#7DD3FC' : BLUE_DARK, fontSize: 13, marginTop: 1 }}>✓</span>
                      <span style={{ fontSize: 12, color: plan.popular ? 'rgba(255,255,255,0.85)' : '#555', lineHeight: 1.5 }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ ABOUT ════════════════════════════════════════════════ */}
      <section id="about" style={{ padding: '80px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: BLUE_DARK, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>About</p>
            <h2 style={{ fontSize: 34, fontWeight: 800, color: PURPLE_DARK, margin: '0 0 16px', lineHeight: 1.2 }}>Built by Innovation SL, for Sierra Leone and beyond</h2>
            <p style={{ fontSize: 14, color: '#555', lineHeight: 1.8, marginBottom: 14 }}>
              Innovation SL is an Entrepreneurship Support Organisation established in 2017 with a mission to cultivate a dynamic entrepreneurial ecosystem nurturing high-growth startups and SMEs in Sierra Leone.
            </p>
            <p style={{ fontSize: 14, color: '#555', lineHeight: 1.8, marginBottom: 14 }}>
              BizReady grew out of the InvestSalone Project — a World Bank–supported programme that conducted over 60 business diagnostics for Sierra Leonean SMEs. We turned those diagnostics into a scalable, automated platform that any bank in West Africa can deploy.
            </p>
            <p style={{ fontSize: 14, color: '#555', lineHeight: 1.8, marginBottom: 28 }}>
              Our approach combines quantitative scoring with qualitative expert assessment, producing a single Investment Readiness Index that reflects real business health — not just what a business owner says, but what the data shows.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <a href="https://innosl.com" style={{ padding: '10px 22px', borderRadius: 8, background: PURPLE, color: '#fff', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>Visit Innovation SL →</a>
              <a href="#contact" style={{ padding: '10px 22px', borderRadius: 8, border: `1px solid ${PURPLE}`, color: PURPLE, fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>Get in touch</a>
            </div>
          </div>
          <div>
            <div style={{ background: `linear-gradient(135deg, ${PURPLE_DARK}, ${BLUE_DARK})`, borderRadius: 20, padding: 32, color: '#fff' }}>
              <div style={{ fontSize: 40, fontWeight: 800, marginBottom: 4 }}>Innovation SL</div>
              <div style={{ fontSize: 16, color: '#C4B5FD', marginBottom: 28 }}>Creating the Future Today</div>
              {[
                ['2017', 'Founded in Freetown, Sierra Leone'],
                ['60+',  'SME diagnostics completed under InvestSalone'],
                ['$211K','Projected annual platform revenue (ARR)'],
                ['3',    'Capacity levels · 12 assessment areas'],
              ].map(([val, label]) => (
                <div key={label} style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#7DD3FC', minWidth: 52 }}>{val}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ FAQ ══════════════════════════════════════════════════ */}
      <section style={{ padding: '80px 24px', background: GRAY }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 34, fontWeight: 800, color: PURPLE_DARK, margin: '0 0 12px' }}>Frequently asked questions</h2>
          </div>
          {FAQS.map((faq, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{ width: '100%', textAlign: 'left', padding: '16px 20px', borderRadius: openFaq === i ? '10px 10px 0 0' : 10, background: '#fff', border: `0.5px solid ${openFaq === i ? PURPLE : '#EDE9FE'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: PURPLE_DARK }}>{faq.q}</span>
                <span style={{ fontSize: 18, color: PURPLE, transform: openFaq === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}>+</span>
              </button>
              {openFaq === i && (
                <div style={{ padding: '14px 20px 18px', background: PURPLE_LIGHT, borderRadius: '0 0 10px 10px', border: `0.5px solid ${PURPLE}`, borderTop: 'none' }}>
                  <p style={{ fontSize: 13, color: '#444', lineHeight: 1.7, margin: 0 }}>{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ══ CONTACT ══════════════════════════════════════════════ */}
      <section id="contact" style={{ padding: '80px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 620, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: BLUE_DARK, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Contact</p>
          <h2 style={{ fontSize: 34, fontWeight: 800, color: PURPLE_DARK, margin: '0 0 14px' }}>Get in touch</h2>
          <p style={{ fontSize: 14, color: '#666', marginBottom: 36 }}>{"Whether you're a bank exploring a pilot, or a development finance institution looking for an enterprise deployment — we'd love to hear from you."}</p>
          {submitted ? (
            <div style={{ background: '#E1F5EE', borderRadius: 14, padding: 32, border: '1px solid #6EE7B7' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
              <p style={{ fontSize: 16, fontWeight: 600, color: '#065F46', margin: '0 0 8px' }}>Message sent!</p>
              <p style={{ fontSize: 13, color: '#047857', margin: 0 }}>{"We'll get back to you within 1 business day. — Francis Stevens George, Innovation SL"}</p>
            </div>
          ) : (
            <form onSubmit={e => { e.preventDefault(); setSubmitted(true) }} style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
              {[
                { key: 'name', label: 'Your name', type: 'text', placeholder: 'Francis Stevens George' },
                { key: 'email', label: 'Email address', type: 'email', placeholder: 'you@yourbank.com' },
                { key: 'bank', label: 'Bank / organisation', type: 'text', placeholder: 'e.g. UBA Sierra Leone' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder} required value={contactForm[f.key as keyof typeof contactForm]}
                    onChange={e => setContactForm(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 9, border: '0.5px solid #D8D0F0', fontSize: 13, outline: 'none', background: '#fff', color: '#333' }} />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Message</label>
                <textarea rows={4} placeholder="Tell us about your bank and what you're looking to achieve..." required
                  value={contactForm.message}
                  onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 9, border: '0.5px solid #D8D0F0', fontSize: 13, outline: 'none', resize: 'vertical', background: '#fff', color: '#333' }} />
              </div>
              <button type="submit" style={{ padding: '13px', borderRadius: 10, background: PURPLE, color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' }}>
                Send message →
              </button>
            </form>
          )}
          <div style={{ marginTop: 40, padding: '20px', background: GRAY, borderRadius: 12, fontSize: 13, color: '#555', lineHeight: 1.7 }}>
            <strong style={{ color: PURPLE_DARK }}>Francis Stevens George</strong><br />
            Managing Director, Innovation SL · Project Manager, BizReady<br />
            <a href="mailto:fsg@innosl.com" style={{ color: BLUE_DARK }}>fsg@innosl.com</a> · +232 (0) 34 760 307
          </div>
        </div>
      </section>

      {/* ══ FOOTER ═══════════════════════════════════════════════ */}
      <footer style={{ background: PURPLE_DARK, padding: '48px 24px 28px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40, marginBottom: 40 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: PURPLE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>B</span>
                </div>
                <span style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>BizReady</span>
              </div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, maxWidth: 260, margin: '0 0 16px' }}>
                The SME Investment Readiness Platform for African banks. Powered by Innovation SL — Creating the Future Today.
              </p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>© {new Date().getFullYear()} Innovation SL. All rights reserved.</p>
            </div>
            {[
              { title: 'Product', links: ['Features', 'How it works', 'Pricing', 'Question bank', 'API docs'] },
              { title: 'Company', links: ['About', 'Contact', 'InnoSL.com', 'InvestSalone', 'Careers'] },
              { title: 'Legal',   links: ['Privacy policy', 'Terms of service', 'Data security', 'Cookie policy'] },
            ].map(col => (
              <div key={col.title}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 }}>{col.title}</p>
                {col.links.map(link => (
                  <a key={link} href="#" style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.65)', textDecoration: 'none', marginBottom: 10 }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}>
                    {link}
                  </a>
                ))}
              </div>
            ))}
          </div>
          <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.1)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: 0 }}>Built with ♥ in Freetown, Sierra Leone</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: 0 }}>Hosted on Vercel · MongoDB Atlas · Clerk · Resend</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
