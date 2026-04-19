import Link from 'next/link'

const P  = '#5B1FA8'
const PD = '#3B1270'
const BD = '#0284C7'

const UPDATED = 'April 18, 2026'

function LegalLayout({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Inter', system-ui, sans-serif", minHeight: '100vh', background: '#fff', color: '#1F1535' }}>
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: P, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>B</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: 15, color: PD }}>BizReady</span>
          </Link>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <Link href="/contact" style={{ fontSize: 13, color: '#666', textDecoration: 'none' }}>Contact</Link>
            <Link href="/" style={{ fontSize: 13, color: P, textDecoration: 'none', fontWeight: 600 }}>← Home</Link>
          </div>
        </div>
      </nav>

      <div style={{ background: `linear-gradient(135deg, ${PD} 0%, ${P} 60%, ${BD} 100%)`, padding: '56px 32px 64px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(196,181,253,0.9)', letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 14 }}>Legal</p>
          <h1 style={{ fontSize: 42, fontWeight: 800, color: '#fff', margin: '0 0 14px', letterSpacing: -0.8, lineHeight: 1.1 }}>{title}</h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', margin: 0 }}>{subtitle}</p>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '56px 32px 96px' }}>
        {children}
        <div style={{ marginTop: 56, paddingTop: 28, borderTop: '0.5px solid #EDE9FE', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 12, color: '#bbb', margin: 0 }}>Last updated: {UPDATED}</p>
          <div style={{ display: 'flex', gap: 20 }}>
            <Link href="/privacy"  style={{ fontSize: 12.5, color: P, textDecoration: 'none' }}>Privacy Policy</Link>
            <Link href="/terms"    style={{ fontSize: 12.5, color: P, textDecoration: 'none' }}>Terms of Service</Link>
            <Link href="/security" style={{ fontSize: 12.5, color: P, textDecoration: 'none' }}>Data Security</Link>
          </div>
        </div>
      </div>

      <div style={{ borderTop: '0.5px solid #F0EDF8', background: '#FAFAF8', padding: '20px 32px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: 12, color: '#bbb', margin: 0 }}>© {new Date().getFullYear()} Innovation SL</p>
          <Link href="/" style={{ fontSize: 12.5, color: P, textDecoration: 'none', fontWeight: 500 }}>← Back to BizReady</Link>
        </div>
      </div>
    </div>
  )
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontSize: 20, fontWeight: 700, color: PD, margin: '40px 0 12px', letterSpacing: -0.3 }}>{children}</h2>
}
function P1({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 14.5, color: '#444', lineHeight: 1.8, margin: '0 0 14px' }}>{children}</p>
}

function CookieRow({ name, type, purpose, duration }: { name: string; type: string; purpose: string; duration: string }) {
  return (
    <tr>
      <td style={{ padding: '12px 16px', fontSize: 13, color: PD, fontWeight: 600, borderBottom: '0.5px solid #EDE9FE', verticalAlign: 'top' }}>{name}</td>
      <td style={{ padding: '12px 16px', fontSize: 12, color: '#888', borderBottom: '0.5px solid #EDE9FE', verticalAlign: 'top' }}>
        <span style={{ background: type === 'Essential' ? '#EDE9FE' : '#E0F2FE', color: type === 'Essential' ? P : BD, padding: '2px 8px', borderRadius: 6, fontWeight: 600, fontSize: 11 }}>{type}</span>
      </td>
      <td style={{ padding: '12px 16px', fontSize: 13, color: '#555', borderBottom: '0.5px solid #EDE9FE', verticalAlign: 'top', lineHeight: 1.5 }}>{purpose}</td>
      <td style={{ padding: '12px 16px', fontSize: 12, color: '#888', borderBottom: '0.5px solid #EDE9FE', verticalAlign: 'top', whiteSpace: 'nowrap' }}>{duration}</td>
    </tr>
  )
}

export default function CookiesPage() {
  return (
    <LegalLayout title="Cookie Policy" subtitle="How BizReady uses cookies and similar technologies to provide the platform.">
      <P1>BizReady uses cookies to make the platform work correctly and to understand how it is being used. This page explains what cookies we set, why we set them, and how you can control them.</P1>

      <H2>What Are Cookies?</H2>
      <P1>Cookies are small text files placed on your device when you visit a website. They allow the site to remember your preferences, keep you logged in, and understand how you use the service.</P1>

      <H2>Cookies We Use</H2>
      <div style={{ overflowX: 'auto', marginBottom: 14 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '0.5px solid #EDE9FE', borderRadius: 12, overflow: 'hidden' }}>
          <thead>
            <tr style={{ background: '#FDFCFF' }}>
              {['Cookie', 'Type', 'Purpose', 'Duration'].map(h => (
                <th key={h} style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 0.8, textAlign: 'left', borderBottom: '0.5px solid #EDE9FE' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <CookieRow name="__clerk_db_jwt" type="Essential" purpose="Clerk authentication session token. Required to keep you logged in." duration="Session" />
            <CookieRow name="__session"      type="Essential" purpose="User session identifier. Required for all authenticated platform features." duration="7 days" />
            <CookieRow name="__client_uat"   type="Essential" purpose="Clerk client user activity tracking for session security." duration="Session" />
            <CookieRow name="bz_tenant"      type="Essential" purpose="Stores the active bank tenant context so the correct white-label theme loads." duration="1 day" />
            <CookieRow name="_vercel_no_cache" type="Analytics" purpose="Vercel edge network analytics. Helps us understand platform performance." duration="1 day" />
          </tbody>
        </table>
      </div>

      <H2>Essential Cookies</H2>
      <P1>Essential cookies are required for BizReady to function. Without them you cannot log in, access your dashboard, or complete a diagnostic. Because they are strictly necessary, they cannot be disabled.</P1>

      <H2>Analytics Cookies</H2>
      <P1>We use minimal analytics to understand platform performance and user flows. Analytics data is aggregated and not linked to individual user identities. You can opt out by enabling &quot;Do Not Track&quot; in your browser settings — we honour this signal.</P1>

      <H2>Managing Cookies</H2>
      <P1>You can control cookies through your browser settings. Most browsers allow you to block or delete cookies. Note that blocking essential cookies will prevent you from logging in to BizReady. Here are links to cookie management guides for common browsers:</P1>
      <ul style={{ paddingLeft: 20, marginBottom: 14 }}>
        {[
          ['Chrome', 'https://support.google.com/chrome/answer/95647'],
          ['Firefox', 'https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer'],
          ['Safari', 'https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac'],
          ['Edge', 'https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406'],
        ].map(([browser, url]) => (
          <li key={browser} style={{ fontSize: 14.5, color: '#444', lineHeight: 1.8, marginBottom: 8 }}>
            <a href={url} target="_blank" rel="noreferrer" style={{ color: BD }}>{browser}</a>
          </li>
        ))}
      </ul>

      <H2>Contact</H2>
      <P1>Questions about our cookie usage? Email <a href="mailto:fsg@innosl.com" style={{ color: BD }}>fsg@innosl.com</a>.</P1>
    </LegalLayout>
  )
}
