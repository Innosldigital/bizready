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
            <Link href="/security" style={{ fontSize: 12.5, color: P, textDecoration: 'none' }}>Data Security</Link>
            <Link href="/cookies"  style={{ fontSize: 12.5, color: P, textDecoration: 'none' }}>Cookies</Link>
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
function Li({ children }: { children: React.ReactNode }) {
  return <li style={{ fontSize: 14.5, color: '#444', lineHeight: 1.8, marginBottom: 8 }}>{children}</li>
}

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" subtitle="The terms and conditions governing your use of the BizReady platform.">
      <P1>By accessing or using BizReady, you agree to be bound by these Terms of Service. If you do not agree, you may not use the platform. These terms apply to all bank partners, SME users, and InnoSL staff.</P1>

      <H2>1. Subscription Plans</H2>
      <P1>BizReady is offered on a monthly subscription basis (Starter, Growth, Enterprise). Subscriptions are billed in advance. You may cancel at any time, and your access continues until the end of the current billing period. No refunds are issued for partial months.</P1>

      <H2>2. Permitted Use</H2>
      <P1>You agree to use BizReady only for its intended purpose — assessing and improving the investment readiness of SME clients. You may not:</P1>
      <ul style={{ paddingLeft: 20, marginBottom: 14 }}>
        <Li>Share login credentials with unauthorised parties.</Li>
        <Li>Attempt to reverse-engineer, scrape, or copy the scoring algorithm.</Li>
        <Li>Use the platform for any unlawful purpose.</Li>
        <Li>Misrepresent diagnostic results to SME clients or third parties.</Li>
      </ul>

      <H2>3. Data Ownership</H2>
      <P1>SME diagnostic data belongs to the SME and the bank that administered the diagnostic. Innovation SL may use anonymised, aggregated data to improve the platform. We do not claim ownership of your business data.</P1>

      <H2>4. Service Availability</H2>
      <P1>We aim for 99.9% uptime on Growth and Enterprise plans (SLA). Planned maintenance will be communicated 48 hours in advance. Innovation SL is not liable for losses resulting from downtime outside our direct control.</P1>

      <H2>5. Intellectual Property</H2>
      <P1>The BizReady name, logo, scoring methodology, and platform code are the exclusive property of Innovation SL. Bank partners retain ownership of their branding assets provided for white-labelling.</P1>

      <H2>6. Termination</H2>
      <P1>Either party may terminate the agreement with 30 days written notice. Innovation SL may suspend access immediately for material breach, including non-payment or misuse. Upon termination, data is retained for 90 days before deletion.</P1>

      <H2>7. Limitation of Liability</H2>
      <P1>Innovation SL is not liable for lending decisions made by banks based on BizReady diagnostic scores. The platform provides analytical information to support — not replace — human judgment. Our total liability is capped at the subscription fees paid in the preceding 3 months.</P1>

      <H2>8. Governing Law</H2>
      <P1>These terms are governed by the laws of Sierra Leone. Any disputes will be resolved in the courts of Freetown, Sierra Leone.</P1>

      <H2>9. Contact</H2>
      <P1>For questions about these terms, contact <a href="mailto:fsg@innosl.com" style={{ color: BD }}>fsg@innosl.com</a>.</P1>
    </LegalLayout>
  )
}
