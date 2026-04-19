'use client'

import { useState } from 'react'
import Link from 'next/link'

const P  = '#5B1FA8'
const PD = '#3B1270'
const PL = '#EDE9FE'
const BD = '#0284C7'

export default function ContactPage() {
  const [form, setForm]           = useState({ name: '', email: '', bank: '', message: '' })
  const [submitted, setSubmitted] = useState(false)

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [key]: e.target.value })),
    onFocus:  (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      (e.target.style.borderColor = P),
    onBlur:   (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      (e.target.style.borderColor = '#D8D0F0'),
  })

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 15px', borderRadius: 10,
    border: '0.5px solid #D8D0F0', fontSize: 13.5, outline: 'none',
    background: '#fff', color: '#333', boxSizing: 'border-box',
    transition: 'border-color 0.15s', fontFamily: 'inherit',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 10.5, fontWeight: 700, color: '#666',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 7,
  }

  return (
    <div style={{ fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Inter', system-ui, sans-serif", minHeight: '100vh', background: '#fff', color: '#1F1535' }}>
      <style>{`
        .contact-grid { display:grid; grid-template-columns:1fr 1.5fr; gap:56px; align-items:start; }
        .form-row      { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
        @media (max-width:768px) {
          .contact-grid { grid-template-columns:1fr; gap:40px; }
          .form-row     { grid-template-columns:1fr; }
        }
      `}</style>

      {/* ── Nav ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,255,255,0.88)', backdropFilter: 'saturate(180%) blur(20px)', WebkitBackdropFilter: 'saturate(180%) blur(20px)', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: P, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>B</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: PD, letterSpacing: -0.3 }}>BizReady</span>
            <span style={{ fontSize: 10, color: '#bbb', marginLeft: 2 }}>by Innovation SL</span>
          </Link>
          <Link href="/" style={{ fontSize: 13, color: '#555', textDecoration: 'none', fontWeight: 500, padding: '8px 16px', borderRadius: 9, border: '0.5px solid #E0DBF5', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = PL; e.currentTarget.style.color = P }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#555' }}>
            ← Back to home
          </Link>
        </div>
      </nav>

      {/* ── Hero band ── */}
      <div style={{ background: `linear-gradient(135deg, ${PD} 0%, ${P} 58%, ${BD} 100%)`, padding: '72px 32px 88px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#C4B5FD', letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 16 }}>Contact Us</p>
          <h1 style={{ fontSize: 48, fontWeight: 800, color: '#fff', margin: '0 0 18px', letterSpacing: -1, lineHeight: 1.1 }}>{"Let's build something\ntogether"}</h1>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.72)', lineHeight: 1.65, margin: 0 }}>
            {"Whether you're a bank exploring a pilot, or a development finance institution looking for enterprise deployment — we'd love to hear from you."}
          </p>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '64px 24px 96px' }}>
      <div className="contact-grid">

        {/* Left — info */}
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: PD, margin: '0 0 8px', letterSpacing: -0.3 }}>Get in touch</h2>
          <p style={{ fontSize: 14, color: '#777', lineHeight: 1.7, marginBottom: 36 }}>Our team typically responds within 1 business day.</p>

          {/* Contact card */}
          <div style={{ padding: '24px', borderRadius: 18, border: '0.5px solid #EDE9FE', background: '#FDFCFF', marginBottom: 16, boxShadow: '0 2px 12px rgba(91,31,168,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg, ${P}, ${BD})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 18, flexShrink: 0 }}>F</div>
              <div>
                <p style={{ fontSize: 14.5, fontWeight: 700, color: PD, margin: 0 }}>Francis Stevens George</p>
                <p style={{ fontSize: 12, color: '#999', margin: '2px 0 0' }}>Managing Director, Innovation SL</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a href="mailto:fsg@innosl.com" style={{ fontSize: 13.5, color: BD, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, fontWeight: 500 }}>
                <span style={{ fontSize: 16 }}>✉</span> fsg@innosl.com
              </a>
              <a href="tel:+23234760307" style={{ fontSize: 13.5, color: BD, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, fontWeight: 500 }}>
                <span style={{ fontSize: 16 }}>📞</span> +232 (0) 34 760 307
              </a>
            </div>
          </div>

          {/* Location card */}
          <div style={{ padding: '20px 24px', borderRadius: 16, border: '0.5px solid #EDE9FE', background: '#FDFCFF', marginBottom: 16, boxShadow: '0 2px 12px rgba(91,31,168,0.05)' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Location</p>
            <p style={{ fontSize: 14, fontWeight: 600, color: PD, margin: '0 0 4px' }}>Innovation SL</p>
            <p style={{ fontSize: 13, color: '#777', margin: 0, lineHeight: 1.65 }}>Freetown, Sierra Leone<br />West Africa</p>
          </div>

          {/* Response SLA */}
          <div style={{ padding: '14px 18px', borderRadius: 12, background: '#E1F5EE', border: '1px solid #6EE7B7' }}>
            <p style={{ fontSize: 13, color: '#065F46', margin: 0 }}>⚡ We typically respond within 1 business day</p>
          </div>

          {/* What to expect */}
          <div style={{ marginTop: 32 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>What happens next</p>
            {[
              ['1', 'We review your message and match you to the right plan.'],
              ['2', 'A call is scheduled to walk you through the platform.'],
              ['3', 'Your bank portal goes live within 24 hours of signing up.'],
            ].map(([n, txt]) => (
              <div key={n} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 24, height: 24, borderRadius: 7, background: PL, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: P, flexShrink: 0 }}>{n}</div>
                <p style={{ fontSize: 13, color: '#666', margin: 0, lineHeight: 1.65 }}>{txt}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right — form */}
        <div>
          {submitted ? (
            <div style={{ background: '#E1F5EE', borderRadius: 22, padding: '56px 40px', textAlign: 'center', border: '1px solid #6EE7B7', boxShadow: '0 4px 24px rgba(16,185,129,0.12)' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28 }}>✓</div>
              <h3 style={{ fontSize: 24, fontWeight: 700, color: '#065F46', margin: '0 0 10px' }}>Message sent!</h3>
              <p style={{ fontSize: 14.5, color: '#047857', margin: '0 0 28px', lineHeight: 1.65 }}>{"We'll get back to you within 1 business day.\n— Francis Stevens George, Innovation SL"}</p>
              <button
                onClick={() => { setSubmitted(false); setForm({ name: '', email: '', bank: '', message: '' }) }}
                style={{ padding: '11px 26px', borderRadius: 10, background: '#065F46', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, fontFamily: 'inherit' }}>
                Send another message
              </button>
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: 22, padding: '40px', border: '0.5px solid #EDE9FE', boxShadow: '0 4px 24px rgba(91,31,168,0.07)' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: PD, margin: '0 0 28px', letterSpacing: -0.3 }}>Send us a message</h3>
              <form onSubmit={e => { e.preventDefault(); setSubmitted(true) }} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                <div className="form-row">
                  <div>
                    <label style={labelStyle}>Your name</label>
                    <input type="text" placeholder="e.g. Francis George" required style={inputStyle} {...field('name')} />
                  </div>
                  <div>
                    <label style={labelStyle}>Email address</label>
                    <input type="email" placeholder="you@yourbank.com" required style={inputStyle} {...field('email')} />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Bank / Organisation</label>
                  <input type="text" placeholder="e.g. UBA Sierra Leone" required style={inputStyle} {...field('bank')} />
                </div>

                <div>
                  <label style={labelStyle}>Message</label>
                  <textarea
                    rows={5}
                    placeholder="Tell us about your bank and what you're looking to achieve with BizReady..."
                    required
                    style={{ ...inputStyle, resize: 'vertical' }}
                    {...field('message')}
                  />
                </div>

                {/* Plan interest */}
                <div>
                  <label style={labelStyle}>I&apos;m interested in</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    {['Starter', 'Growth', 'Enterprise'].map(plan => (
                      <label key={plan} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, border: '0.5px solid #D8D0F0', cursor: 'pointer', fontSize: 13, color: '#555', fontWeight: 500 }}>
                        <input type="radio" name="plan" value={plan} style={{ accentColor: P }} />
                        {plan}
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  style={{ padding: '14px', borderRadius: 12, background: P, color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', letterSpacing: -0.2, transition: 'opacity 0.15s', fontFamily: 'inherit', marginTop: 4 }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                  Send message →
                </button>

                <p style={{ fontSize: 11.5, color: '#aaa', textAlign: 'center', margin: 0, lineHeight: 1.6 }}>
                  By submitting you agree to our{' '}
                  <a href="#" style={{ color: P, textDecoration: 'none' }}>Privacy Policy</a>
                  . We never share your data.
                </p>
              </form>
            </div>
          )}
        </div>
      </div>
      </div>

      {/* ── Footer ── */}
      <div style={{ borderTop: '0.5px solid #F0EDF8', background: '#FAFAF8', padding: '22px 32px' }}>
        <div style={{ maxWidth: 980, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: 12, color: '#bbb', margin: 0 }}>© {new Date().getFullYear()} Innovation SL. All rights reserved.</p>
          <Link href="/" style={{ fontSize: 12.5, color: P, textDecoration: 'none', fontWeight: 500 }}>← Back to BizReady</Link>
        </div>
      </div>
    </div>
  )
}
