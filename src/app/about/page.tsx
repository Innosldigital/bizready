// src/app/about/page.tsx
import Link from 'next/link'

const P  = '#5B1FA8'
const PD = '#3B1270'
const BD = '#0284C7'
const PL = '#EDE9FE'

const PROJECTS = [
  {
    name: 'InvestSalone',
    tag:  'World Bank Supported',
    desc: 'A flagship business diagnostic programme supporting Sierra Leonean SMEs with investment readiness assessments and technical assistance.',
    color: '#003F6B',
  },
  {
    name: 'SLEDP',
    tag:  'SME Development',
    desc: 'Sierra Leone Enterprise Development Programme — applying the BizReady diagnostic tool to assess and strengthen enterprise capacity.',
    color: '#0F6E56',
  },
  {
    name: 'UNDP Informal Sector Project',
    tag:  'UNDP',
    desc: "A UNDP-supported initiative deploying the diagnostic tool within Sierra Leone's informal sector to surface hidden business potential.",
    color: '#0079C0',
  },
  {
    name: 'ILO',
    tag:  'International Labour Organisation',
    desc: 'Collaboration with the ILO to assess business readiness and capacity gaps among target enterprises and MSMEs.',
    color: '#C8102E',
  },
  {
    name: 'Nexus',
    tag:  'Innovation Programme',
    desc: 'An innovation-focused programme leveraging the diagnostic tool to evaluate and strengthen participating enterprises.',
    color: '#7C3AED',
  },
  {
    name: 'AI Pitch Winners',
    tag:  'Tech & AI',
    desc: 'Post-pitch diagnostic support for AI pitch competition winners — assessing business health and readiness for scale.',
    color: '#0284C7',
  },
  {
    name: 'Smart Mobility Pitch Winners',
    tag:  'Mobility & Transport',
    desc: 'Business readiness diagnostics for winners of the Smart Mobility pitch competition, supporting their growth trajectory.',
    color: '#059669',
  },
]

export default function AboutPage() {
  return (
    <div style={{ fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Inter', system-ui, sans-serif", color: '#1F1535', background: '#fff' }}>

      <style>{`
        .about-hero-grid { display:grid; grid-template-columns:1fr 1fr; gap:64px; align-items:center; }
        .projects-grid   { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
        .two-col         { display:grid; grid-template-columns:1fr 1fr; gap:48px; align-items:start; }
        .sec-pad         { padding:96px 32px; }

        @media (max-width:1024px) {
          .projects-grid { grid-template-columns:repeat(2,1fr); }
          .sec-pad       { padding:72px 24px; }
        }
        @media (max-width:768px) {
          .about-hero-grid { grid-template-columns:1fr; }
          .projects-grid   { grid-template-columns:1fr; }
          .two-col         { grid-template-columns:1fr; gap:32px; }
          .sec-pad         { padding:56px 20px; }
          .hero-h1         { font-size:32px !important; }
        }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,255,255,0.88)', backdropFilter: 'saturate(180%) blur(20px)', WebkitBackdropFilter: 'saturate(180%) blur(20px)', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: P, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>B</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: PD, letterSpacing: -0.3 }}>BizReady</span>
          </Link>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Link href="/" style={{ fontSize: 13, color: '#666', textDecoration: 'none', fontWeight: 500 }}>← Back to home</Link>
            <Link href="/contact" style={{ padding: '8px 18px', borderRadius: 20, background: P, color: '#fff', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>Contact us</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ background: `linear-gradient(135deg, ${PD} 0%, ${P} 60%, ${BD} 100%)`, padding: '88px 32px 100px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.12)', borderRadius: 20, padding: '5px 16px', fontSize: 12, color: '#7DD3FC', fontWeight: 600, marginBottom: 22, border: '0.5px solid rgba(255,255,255,0.2)' }}>
            About BizReady
          </div>
          <h1 className="hero-h1" style={{ fontSize: 48, fontWeight: 800, color: '#fff', lineHeight: 1.1, margin: '0 0 20px', letterSpacing: -1.2 }}>
            Transforming how Africa<br />
            <span style={{ color: '#7DD3FC' }}>identifies investment-ready SMEs</span>
          </h1>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.72)', lineHeight: 1.68, maxWidth: 560, margin: '0 auto' }}>
            BizReady grew out of the need to leverage our proven diagnostic tool — conducted over 60 business diagnostics for Sierra Leone SMEs, MSMEs and Start-ups — to the wider ecosystem.
          </p>
        </div>
      </section>

      {/* ── INNOVATION SL STORY ── */}
      <section className="sec-pad" style={{ background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="two-col">
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: BD, letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 12 }}>Our Story</p>
              <h2 style={{ fontSize: 34, fontWeight: 800, color: PD, margin: '0 0 20px', lineHeight: 1.15, letterSpacing: -0.6 }}>Built by Innovation SL</h2>
              <p style={{ fontSize: 15, color: '#555', lineHeight: 1.8, marginBottom: 16 }}>
                Innovation SL is an Entrepreneurship Support Organisation established in 2017 with a mission to cultivate a dynamic entrepreneurial ecosystem nurturing high-growth startups and SMEs in Sierra Leone.
              </p>
              <p style={{ fontSize: 15, color: '#555', lineHeight: 1.8, marginBottom: 16 }}>
                Over the years we developed and refined a powerful business diagnostic methodology, deploying it across more than 60 engagements with SMEs, MSMEs and start-ups in Sierra Leone under various national and international programmes.
              </p>
              <p style={{ fontSize: 15, color: '#555', lineHeight: 1.8, marginBottom: 28 }}>
                BizReady is the digital platform that packages that methodology — making it accessible to any bank, development finance institution, or accelerator that wants to identify and support investment-ready businesses at scale.
              </p>
              <a href="https://innosl.com" target="_blank" rel="noreferrer"
                style={{ padding: '12px 22px', borderRadius: 10, background: P, color: '#fff', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
                Visit Innovation SL →
              </a>
            </div>
            <div style={{ background: `linear-gradient(145deg, ${PD} 0%, ${BD} 100%)`, borderRadius: 22, padding: '36px', color: '#fff' }}>
              <p style={{ fontSize: 13, color: '#C4B5FD', fontWeight: 600, marginBottom: 24, textTransform: 'uppercase', letterSpacing: 1.2 }}>By the numbers</p>
              {[
                ['2017', 'Founded in Freetown, Sierra Leone'],
                ['60+',  'Business diagnostics across SMEs, MSMEs & Start-ups'],
                ['7',    'Programmes where the tool has been deployed'],
                ['12',   'Bank and institutional partners'],
                ['3',    'Capacity dimensions · 12 assessment areas'],
              ].map(([val, label]) => (
                <div key={label} style={{ display: 'flex', gap: 16, alignItems: 'center', paddingBottom: 18, marginBottom: 18, borderBottom: '0.5px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#7DD3FC', minWidth: 56, letterSpacing: -0.5 }}>{val}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── WHITE LABEL ── */}
      <section className="sec-pad" style={{ background: 'linear-gradient(135deg, #0C3547 0%, #0284C7 55%, #0F6E56 100%)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }} className="two-col">
          <div>
            <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.12)', borderRadius: 20, padding: '5px 16px', fontSize: 12, color: '#6EE7B7', fontWeight: 600, marginBottom: 22, border: '0.5px solid rgba(255,255,255,0.2)' }}>
              White-Label Platform
            </div>
            <h2 style={{ fontSize: 38, fontWeight: 800, color: '#fff', margin: '0 0 18px', lineHeight: 1.1, letterSpacing: -1 }}>
              Your Brand.<br /><span style={{ color: '#6EE7B7' }}>Your Portal.</span><br />Your SMEs.
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.72)', lineHeight: 1.7, marginBottom: 28, maxWidth: 480 }}>
              Every bank partner gets a fully branded diagnostic experience — their colours, logo, and domain, all powered by the BizReady engine. SMEs never see the BizReady brand; they see their bank.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px' }}>
              {['Custom domain (yourbank.com/diagnostic)', 'Bank colours, logo, and messaging', 'Dedicated relationship manager dashboard', 'Isolated data — each bank sees only their SMEs'].map(item => (
                <li key={item} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12, fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>
                  <span style={{ color: '#6EE7B7', fontSize: 16, flexShrink: 0 }}>✓</span> {item}
                </li>
              ))}
            </ul>
            <Link href="/contact" style={{ padding: '13px 26px', borderRadius: 11, background: '#fff', color: P, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
              Request a demo →
            </Link>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 20, border: '0.5px solid rgba(255,255,255,0.15)', padding: '32px', color: '#fff' }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 20 }}>Example bank portals</p>
            {[
              { abbr: 'UBA',  name: 'UBA Sierra Leone',    color: '#C8102E' },
              { abbr: 'GTB',  name: 'GTBank Sierra Leone',  color: '#F68B1F' },
              { abbr: 'SLCB', name: 'SL Commercial Bank',   color: '#8B0000' },
            ].map(b => (
              <div key={b.abbr} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: b.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{b.abbr}</div>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{b.name}</p>
                  <p style={{ margin: '3px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>Fully branded portal · Custom domain</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TA PROGRAMME ── */}
      <section className="sec-pad" style={{ background: 'linear-gradient(135deg, #0F2D22 0%, #0F6E56 55%, #3B1270 100%)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }} className="two-col">
          <div>
            <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.12)', borderRadius: 20, padding: '5px 16px', fontSize: 12, color: '#FCD34D', fontWeight: 600, marginBottom: 22, border: '0.5px solid rgba(255,255,255,0.2)' }}>
              TA Programme
            </div>
            <h2 style={{ fontSize: 38, fontWeight: 800, color: '#fff', margin: '0 0 18px', lineHeight: 1.1, letterSpacing: -1 }}>
              From Diagnostic<br />to <span style={{ color: '#FCD34D' }}>Investment-Ready</span><br />in 8 Weeks
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.72)', lineHeight: 1.7, marginBottom: 28, maxWidth: 480 }}>
              InnoSL&apos;s Technical Assistance programme turns every capacity gap identified in the diagnostic into an actionable improvement plan. Most SMEs reach Investment Ready status within 8–12 weeks of TA completion.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px' }}>
              {['Personalised TA plan per SME based on diagnostic gaps', 'Progress tracked in real time by both bank and SME', 'Re-diagnostic at end of programme', 'Most SMEs gain 20–30 index points after TA'].map(item => (
                <li key={item} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12, fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>
                  <span style={{ color: '#FCD34D', fontSize: 16, flexShrink: 0 }}>✓</span> {item}
                </li>
              ))}
            </ul>
            <Link href="/contact" style={{ padding: '13px 26px', borderRadius: 11, background: '#fff', color: P, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
              Learn about TA support →
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { week: 'Week 0', label: 'Diagnostic completed', desc: 'SME receives Investment Readiness Index and capacity breakdown', color: '#F87171' },
              { week: 'Week 1', label: 'TA plan activated',    desc: 'InnoSL assigns a personalised programme targeting identified gaps', color: '#FCD34D' },
              { week: 'Week 4', label: 'Strategic gaps closed', desc: 'Business planning, governance, and financial management addressed', color: '#6EE7B7' },
              { week: 'Week 8', label: 'Re-diagnostic & score', desc: 'SME retakes the diagnostic. Most reach Investment Ready status', color: '#6EE7B7' },
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', background: 'rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px 18px', border: '0.5px solid rgba(255,255,255,0.1)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: step.color, flexShrink: 0, marginTop: 6 }} />
                <div>
                  <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>{step.week}</p>
                  <p style={{ margin: '3px 0 4px', fontSize: 14, fontWeight: 700, color: '#fff' }}>{step.label}</p>
                  <p style={{ margin: 0, fontSize: 12.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROJECTS / REFERENCES ── */}
      <section className="sec-pad" style={{ background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: BD, letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 12 }}>References</p>
            <h2 style={{ fontSize: 38, fontWeight: 800, color: PD, margin: '0 0 16px', letterSpacing: -0.8 }}>Where we&apos;ve deployed the tool</h2>
            <p style={{ fontSize: 15, color: '#666', maxWidth: 520, margin: '0 auto', lineHeight: 1.65 }}>
              Our diagnostic methodology has been applied across national and international programmes supporting Sierra Leonean enterprises.
            </p>
          </div>
          <div className="projects-grid">
            {PROJECTS.map(proj => (
              <div key={proj.name} style={{ borderRadius: 18, border: '0.5px solid #EDE9FE', background: '#FDFCFF', padding: '24px', boxShadow: '0 2px 12px rgba(91,31,168,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: proj.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 16, color: '#fff', fontWeight: 800 }}>{proj.name[0]}</span>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: PD, lineHeight: 1.3 }}>{proj.name}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 10, color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6 }}>{proj.tag}</p>
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: '#666', lineHeight: 1.65 }}>{proj.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 44 }}>
            <p style={{ fontSize: 14, color: '#888', marginBottom: 20, lineHeight: 1.6 }}>
              37+ businesses diagnosed across 7 programmes — 2022 to 2025.
            </p>
            <Link
              href="/about/programmes"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 30px', borderRadius: 12, background: PD, color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none', boxShadow: '0 4px 20px rgba(59,18,112,0.25)' }}
            >
              View full deployment history
              <span style={{ fontSize: 16 }}>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="sec-pad" style={{ background: `linear-gradient(135deg, ${PD} 0%, ${P} 60%, ${BD} 100%)` }}>
        <div style={{ maxWidth: 620, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, color: '#fff', margin: '0 0 16px', letterSpacing: -0.8, lineHeight: 1.12 }}>Ready to get started?</h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.72)', marginBottom: 32, lineHeight: 1.6 }}>
            Whether you&apos;re a bank, development finance institution, or accelerator — BizReady is built for you.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/#pricing" style={{ padding: '13px 28px', borderRadius: 12, background: '#fff', color: P, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>View plans →</Link>
            <Link href="/contact" style={{ padding: '13px 28px', borderRadius: 12, background: 'rgba(255,255,255,0.10)', color: '#fff', fontWeight: 600, fontSize: 14, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.25)' }}>Contact us →</Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: PD, padding: '32px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: P, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: 13 }}>B</span>
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>BizReady</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>by Innovation SL</span>
          </div>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: 0 }}>© {new Date().getFullYear()} Innovation SL. Built in Freetown, Sierra Leone.</p>
        </div>
      </footer>
    </div>
  )
}
