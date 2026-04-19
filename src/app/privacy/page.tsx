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
            <Link href="/terms"    style={{ fontSize: 12.5, color: P, textDecoration: 'none' }}>Terms of Service</Link>
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

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" subtitle="How we collect, use, and protect your data on the BizReady platform.">
      <P1>Innovation SL (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates the BizReady platform. This Privacy Policy explains how we handle personal and business data collected through our services.</P1>

      <H2>1. Data We Collect</H2>
      <P1>We collect the following categories of data:</P1>
      <ul style={{ paddingLeft: 20, marginBottom: 14 }}>
        <Li><strong>Business information:</strong> company name, sector, annual revenue, years in operation, and other diagnostic inputs provided by SMEs.</Li>
        <Li><strong>Contact details:</strong> name, email address, phone number, and organisation when submitted via our contact form or during bank onboarding.</Li>
        <Li><strong>Diagnostic responses:</strong> answers to investment readiness questions, capacity assessment scores, and TA programme progress data.</Li>
        <Li><strong>Account data:</strong> authentication credentials managed by Clerk (we do not store passwords directly).</Li>
        <Li><strong>Usage data:</strong> pages visited, features used, and time spent on the platform, collected via server logs and analytics.</Li>
      </ul>

      <H2>2. How We Use Your Data</H2>
      <ul style={{ paddingLeft: 20, marginBottom: 14 }}>
        <Li>Calculate the Investment Readiness Index and generate diagnostic reports.</Li>
        <Li>Build and track personalised Technical Assistance plans.</Li>
        <Li>Send automated result emails to SMEs and reports to bank partners.</Li>
        <Li>Improve the scoring algorithm and platform features.</Li>
        <Li>Respond to enquiries submitted via the contact form.</Li>
      </ul>

      <H2>3. Data Sharing</H2>
      <P1>We share SME diagnostic data only with the bank partner that administered the diagnostic. No bank can access another bank&apos;s data. We do not sell personal data to third parties.</P1>
      <P1>We use the following trusted sub-processors: MongoDB Atlas (database), Clerk (authentication), Resend (transactional email), and Vercel (hosting). Each is bound by their own data processing agreements.</P1>

      <H2>4. Data Retention</H2>
      <P1>Diagnostic data is retained for the duration of the bank&apos;s active subscription plus 12 months. Contact form submissions are retained for 24 months. You may request deletion at any time by contacting us.</P1>

      <H2>5. Your Rights</H2>
      <P1>You have the right to access, correct, or delete your personal data. To exercise these rights, email <a href="mailto:fsg@innosl.com" style={{ color: BD }}>fsg@innosl.com</a>. We will respond within 30 days.</P1>

      <H2>6. Contact</H2>
      <P1>For privacy-related questions, contact Francis Stevens George at <a href="mailto:fsg@innosl.com" style={{ color: BD }}>fsg@innosl.com</a> or +232 (0) 34 760 307.</P1>
    </LegalLayout>
  )
}
