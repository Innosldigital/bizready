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
            <Link href="/privacy" style={{ fontSize: 12.5, color: P, textDecoration: 'none' }}>Privacy Policy</Link>
            <Link href="/terms"   style={{ fontSize: 12.5, color: P, textDecoration: 'none' }}>Terms of Service</Link>
            <Link href="/cookies" style={{ fontSize: 12.5, color: P, textDecoration: 'none' }}>Cookies</Link>
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

function SecurityBadge({ label, detail }: { label: string; detail: string }) {
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '16px 20px', borderRadius: 12, border: '0.5px solid #EDE9FE', background: '#FDFCFF', marginBottom: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>🔒</div>
      <div>
        <p style={{ fontSize: 14, fontWeight: 700, color: PD, margin: '0 0 4px' }}>{label}</p>
        <p style={{ fontSize: 13, color: '#666', margin: 0, lineHeight: 1.6 }}>{detail}</p>
      </div>
    </div>
  )
}

export default function SecurityPage() {
  return (
    <LegalLayout title="Data Security" subtitle="How BizReady protects your data and maintains the confidentiality of every bank and SME.">
      <P1>Security is foundational to BizReady. Banks trust us with sensitive business data from their SME clients. Here is exactly how we protect it.</P1>

      <H2>Encryption</H2>
      <SecurityBadge label="Encryption in Transit" detail="All data transmitted between your browser and BizReady is encrypted using TLS 1.3. We enforce HTTPS on all endpoints and reject unencrypted connections." />
      <SecurityBadge label="Encryption at Rest" detail="All data stored in MongoDB Atlas is encrypted at rest using AES-256. Database volumes are encrypted at the infrastructure level." />

      <H2>Data Isolation</H2>
      <SecurityBadge label="Tenant Isolation" detail="Each bank partner operates in a fully isolated data environment. Bank A cannot access Bank B's SME data under any circumstances. Isolation is enforced at the database query level, not just the UI." />
      <SecurityBadge label="SME Data Confidentiality" detail="An SME's diagnostic data is visible only to that SME and the specific bank that administered the diagnostic. Innovation SL staff access data only for platform support purposes." />

      <H2>Access Controls</H2>
      <SecurityBadge label="Authentication" detail="All user authentication is managed by Clerk, which provides multi-factor authentication (MFA), session management, and brute-force protection. We do not store passwords." />
      <SecurityBadge label="Role-Based Access" detail="The platform enforces strict role-based access: Platform Admin, Bank Admin, Bank Staff, and SME. Each role can only access data and features permitted for that role." />

      <H2>Infrastructure</H2>
      <SecurityBadge label="Hosting" detail="BizReady runs on Vercel's edge network with automatic DDoS protection and global distribution. No single point of failure." />
      <SecurityBadge label="Database" detail="MongoDB Atlas provides automated backups, point-in-time recovery, and ISO 27001-certified infrastructure. Data is stored in geographically resilient clusters." />

      <H2>Incident Response</H2>
      <P1>In the event of a security incident, we will notify affected bank partners within 72 hours of discovery. We maintain an incident response plan and conduct regular security reviews of the platform.</P1>

      <H2>Reporting a Vulnerability</H2>
      <P1>If you discover a security vulnerability in BizReady, please disclose it responsibly by emailing <a href="mailto:fsg@innosl.com" style={{ color: BD }}>fsg@innosl.com</a>. We take all reports seriously and will respond within 48 hours.</P1>
    </LegalLayout>
  )
}
