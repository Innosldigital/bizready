// src/app/about/programmes/page.tsx
// Innovation SL — Full Diagnostic Programmes & Projects Inventory
// Not linked in navigation. Accessed via CTA on /about

import Link from 'next/link'

const P  = '#5B1FA8'
const PD = '#3B1270'
const BD = '#0284C7'

const PROGRAMMES = [
  {
    id: 'invest-salone',
    name: 'InvestSalone / SLEDP',
    fullName: 'Sierra Leone Economic Diversification Project',
    funder: 'World Bank',
    period: 'February 2022 – 2023',
    color: '#003F6B',
    accentColor: '#E0F0FF',
    textAccent: '#003F6B',
    summary: 'A flagship business diagnostic programme supporting 30 Sierra Leonean SMEs and start-ups with investment readiness assessments. Full TNAD methodology applied.',
    coverage: '30 businesses diagnosed across multiple sectors. Start-ups and SMEs.',
    districts: 'Freetown and national coverage',
    sectors: ['Agro-processing', 'Fisheries', 'Energy', 'Agriculture', 'Technology', 'Manufacturing', 'Trade'],
    businesses: [
      { id: 'StartUp/01', name: 'MatDan Bennimix Production Company', type: 'Start-up', sector: 'Agro-processing' },
      { id: 'StartUp/02', name: 'Youth Partnership for Aquaculture Development SL Ltd', type: 'Start-up', sector: 'Fisheries' },
      { id: 'StartUp/03', name: 'Auto-Smart Irrigation and Energy', type: 'Start-up', sector: 'Energy / Agriculture' },
      { id: 'StartUp/04', name: 'Susan\'s Recycled Plastic', type: 'Start-up', sector: 'Recycling' },
      { id: 'StartUp/05', name: 'JoBecks Farms', type: 'Start-up', sector: 'Agriculture' },
      { id: 'StartUp/06', name: 'Caballay Investment', type: 'Start-up', sector: 'Investment' },
      { id: 'StartUp/07', name: 'Galilee Gallery Organization', type: 'Start-up', sector: 'Creative' },
      { id: 'StartUp/08', name: 'Kohune\'s Kosmetics', type: 'Start-up', sector: 'Beauty / FMCG' },
      { id: 'StartUp/09', name: 'Green Hall Farms', type: 'Start-up', sector: 'Agriculture' },
      { id: 'StartUp/10', name: 'Sierra Innovation Labs', type: 'Start-up', sector: 'Technology' },
      { id: 'StartUp/11', name: 'Farming Agribusiness and Reproduction', type: 'Start-up', sector: 'Agribusiness' },
      { id: 'StartUp/12', name: 'Ndevuyama Wind Energy Solution', type: 'Start-up', sector: 'Energy' },
      { id: 'StartUp/13', name: 'Saint Conrad Co. Ltd', type: 'Start-up', sector: 'General' },
      { id: 'StartUp/14', name: 'Bilagripreneur', type: 'Start-up', sector: 'Agribusiness' },
      { id: 'SME/09',     name: 'Absolute Barkee Industries', type: 'SME', sector: 'Manufacturing' },
      { id: 'SLEDP',      name: 'Rickma Fishing Company', type: 'SLEDP', sector: 'Fisheries', note: 'July–August 2022' },
      { id: 'SLEDP-075',  name: 'TJAL Enterprise', type: 'SLEDP', sector: 'Trade' },
      { id: 'SLEDP-134',  name: 'Sierra Akker Agricultural Company Ltd', type: 'SLEDP', sector: 'Agriculture / Poultry', note: '2023' },
    ],
    note: '12 additional businesses are part of the confirmed 30-company cohort. Individual files are present in Drive folders.',
  },
  {
    id: 'ilo-opportunity-salone',
    name: 'ILO Opportunity Salone',
    fullName: 'ILO Opportunity Salone Programme',
    funder: 'International Labour Organization (ILO) / European Union (EU)',
    period: 'July – August 2024',
    color: '#C8102E',
    accentColor: '#FDECEA',
    textAccent: '#8B0A1A',
    summary: 'Acceleration diagnostics applied across Bo, Bombali, Kenema, and Port Loko districts targeting cassava, vegetables, and oil palm value chains.',
    coverage: '7 businesses / cooperatives diagnosed including a 4-member cooperative.',
    districts: 'Bo, Bombali, Kenema, Port Loko',
    sectors: ['Agribusiness', 'Cassava', 'Poultry', 'Oil Palm', 'Vegetables', 'Construction'],
    businesses: [
      { id: '1', name: 'SEDMO Construction, Agriculture and General Services', type: 'Enterprise', sector: 'Multi-sector · Bo' },
      { id: '2', name: 'Grassroot Integrated Farming', type: 'Enterprise', sector: 'Agribusiness · Cassava / Poultry' },
      { id: '3', name: 'Nongowa Green Farmers Enterprise', type: 'Enterprise', sector: 'Agriculture · Kenema' },
      { id: '4', name: 'Bo Poultry Feed Cooperative (4 members)', type: 'Cooperative', sector: 'Poultry Feed · Bo', isCooperative: true,
        members: [
          'Centenary Men Agro Processing Poultry Feed — Mr. Quee',
          'Crossroad Development — Mr. Matthew Mannah Magawa',
          'ABK Enterprise — Mr. Abubakarr Kamara',
          'Gbondokorbu Farmers Association — Madam Marie K. Mansaray',
        ],
      },
    ],
  },
  {
    id: 'energy-nexus',
    name: 'Energy Nexus Network',
    fullName: 'Business Incubation Phase 2',
    funder: 'Energy Nexus Network',
    period: 'October 2024',
    color: '#059669',
    accentColor: '#ECFDF5',
    textAccent: '#065F46',
    summary: 'TNAD methodology applied to 5 solar and renewable energy SMEs during Business Incubation Phase 2.',
    coverage: '5 businesses diagnosed across the solar / renewable energy sector.',
    districts: 'Freetown',
    sectors: ['Solar Energy', 'Renewable Energy', 'Agro-Energy Innovation'],
    businesses: [
      { id: '1', name: 'MIK Solar Energy', type: 'SME', sector: 'Solar energy · Freetown' },
      { id: '2', name: 'Ellen Solar Point', type: 'SME', sector: 'Solar energy' },
      { id: '3', name: 'Go Green Solar Energy', type: 'SME', sector: 'Solar energy' },
      { id: '4', name: 'Light Salone Innovation', type: 'SME', sector: 'Solar / Tech innovation' },
      { id: '5', name: 'Vicram-Agro Enterprise', type: 'SME', sector: 'Agro / Energy' },
    ],
  },
  {
    id: 'undp-informal',
    name: 'UNDP Informal Sector',
    fullName: 'UNDP Informal Sector Diagnostics',
    funder: 'UNDP',
    period: 'January – February 2025',
    color: '#0079C0',
    accentColor: '#E8F4FD',
    textAccent: '#005A8E',
    summary: 'Startup diagnostic questionnaire targeting informal sector businesses and tech solutions for the informal economy. Responses collected via Google Form.',
    coverage: 'Multiple informal sector start-ups. Full response data captured in Drive.',
    districts: 'National',
    sectors: ['Informal Economy', 'Tech Solutions', 'Micro-enterprise'],
    businesses: [
      { id: '—', name: 'Multiple informal sector start-ups', type: 'Start-ups', sector: 'Informal economy — full response spreadsheet in Drive' },
    ],
    note: 'Individual business names captured in Google Form response spreadsheet.',
  },
  {
    id: 'freetown-pitch-night',
    name: 'Freetown Pitch Night',
    fullName: 'AI for All Sectors — Freetown Pitch Night',
    funder: 'Innovation SL',
    period: 'February 2025',
    color: '#7C3AED',
    accentColor: '#F5F3FF',
    textAccent: '#4C1D95',
    summary: 'Early-stage and start-up diagnostic questionnaire tailored for AI-focused businesses. Adapted TNAD covering Value Proposition, Business Model, Market Access, Scalability, Financial Viability, AI Integration, and Social Impact.',
    coverage: 'Multiple early-stage AI start-ups across sectors.',
    districts: 'Freetown',
    sectors: ['Agriculture', 'Education', 'Data Management', 'Fintech', 'AI'],
    businesses: [
      { id: '—', name: 'Multiple early-stage AI start-ups', type: 'Start-ups', sector: 'Agriculture, Education, Data Management, Fintech' },
    ],
    note: 'Adapted TNAD questionnaire. Diagnostician: Innovation SL team.',
  },
  {
    id: 'giwei',
    name: 'GIWEI',
    fullName: 'Gender Impact and Women in Entrepreneurship Initiative',
    funder: 'ILO-linked',
    period: 'July – August 2024',
    color: '#DB2777',
    accentColor: '#FDF2F8',
    textAccent: '#831843',
    summary: 'Full investment readiness diagnostic report. TNAD methodology applied with focus on women-led enterprise development and investment readiness.',
    coverage: '1 organisation diagnosed — GIWEI.',
    districts: 'Sierra Leone',
    sectors: ['Gender Entrepreneurship', 'Women-led Enterprise', 'Investment Readiness'],
    diagnostician: 'Mohamed Foday Daboh',
    businesses: [
      { id: '1', name: 'GIWEI — Gender Impact and Women in Entrepreneurship Initiative', type: 'Organisation', sector: 'Gender / Women-led enterprise development' },
    ],
  },
  {
    id: 'village-hope',
    name: 'Village Hope International',
    fullName: 'Village Hope International — Investment Readiness Diagnostic',
    funder: 'Innovation SL (standalone engagement)',
    period: 'April 2024',
    color: '#0F6E56',
    accentColor: '#F0FDF4',
    textAccent: '#064E3B',
    summary: 'Standalone investment readiness diagnostic. Full TNAD report produced by Innovation SL.',
    coverage: '1 organisation diagnosed.',
    districts: 'Sierra Leone',
    sectors: ['NGO', 'Social Enterprise', 'Development'],
    businesses: [
      { id: '1', name: 'Village Hope International', type: 'NGO / Social enterprise', sector: 'International development · Social enterprise' },
    ],
  },
]

export default function ProgrammesPage() {
  return (
    <div style={{ fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Inter', system-ui, sans-serif", color: '#1F1535', background: '#FAFAFA', minHeight: '100vh' }}>

      <style>{`
        .prog-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:24px; }
        .biz-table { width:100%; border-collapse:collapse; }
        .biz-table th, .biz-table td { text-align:left; padding:10px 12px; font-size:13px; }
        .biz-table thead tr { border-bottom: 1px solid rgba(0,0,0,0.07); }
        .biz-table tbody tr { border-bottom: 1px solid rgba(0,0,0,0.04); }
        .biz-table tbody tr:last-child { border-bottom:none; }
        .sec-pad { padding:72px 28px; }
        @media (max-width:900px)  { .prog-grid { grid-template-columns:1fr; } }
        @media (max-width:768px)  { .sec-pad { padding:48px 16px; } .biz-table th { display:none; } }
      `}</style>

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,255,255,0.90)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/about" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', fontSize: 13, color: '#666', fontWeight: 500 }}>
            ← Back to About
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: P, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: 13 }}>B</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: 15, color: PD, letterSpacing: -0.3 }}>BizReady</span>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ background: `linear-gradient(135deg, ${PD} 0%, ${P} 55%, ${BD} 100%)`, padding: '72px 28px 80px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: '5px 16px', fontSize: 12, color: '#A5B4FC', fontWeight: 600, marginBottom: 24, border: '0.5px solid rgba(255,255,255,0.2)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6EE7B7', display: 'inline-block' }} />
            Diagnostic Portfolio · 2022–2025
          </div>
          <h1 style={{ fontSize: 44, fontWeight: 800, color: '#fff', lineHeight: 1.1, margin: '0 0 18px', letterSpacing: -1 }}>
            Innovation SL<br />
            <span style={{ color: '#7DD3FC' }}>Diagnostic Programmes Inventory</span>
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, maxWidth: 620, margin: '0 auto 32px' }}>
            A comprehensive record of all business diagnostic engagements conducted by Innovation SL from 2022 to 2025 — across 7 programmes, 37+ businesses, and 5 international funders.
          </p>
          {/* Summary stats */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { val: '7',    label: 'Programmes' },
              { val: '37+',  label: 'Businesses diagnosed' },
              { val: '5',    label: 'International funders' },
              { val: '2022–2025', label: 'Date range' },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '14px 22px', border: '0.5px solid rgba(255,255,255,0.15)', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>{s.val}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FUNDERS STRIP */}
      <div style={{ background: '#fff', borderBottom: '0.5px solid #EDE9FE', padding: '18px 28px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#999', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginRight: 6 }}>Funders:</span>
          {['World Bank', 'ILO / EU', 'UNDP', 'Energy Nexus Network', 'Innovation SL'].map(f => (
            <span key={f} style={{ fontSize: 12, fontWeight: 600, color: PD, background: '#F5F3FF', borderRadius: 20, padding: '4px 12px', border: '0.5px solid #DDD6FE' }}>{f}</span>
          ))}
        </div>
      </div>

      {/* PROGRAMMES */}
      <section style={{ maxWidth: 1140, margin: '0 auto', padding: '52px 28px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          {PROGRAMMES.map((prog, idx) => (
            <div key={prog.id} id={prog.id} style={{ background: '#fff', borderRadius: 22, border: '0.5px solid #E8E4F3', overflow: 'hidden', boxShadow: '0 2px 20px rgba(91,31,168,0.05)' }}>

              {/* Programme header */}
              <div style={{ background: `linear-gradient(135deg, ${prog.color}ee 0%, ${prog.color} 100%)`, padding: '28px 32px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '0.5px solid rgba(255,255,255,0.3)' }}>
                        <span style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{idx + 1}</span>
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Programme {idx + 1}</p>
                        <h2 style={{ margin: '2px 0 0', fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: -0.4 }}>{prog.name}</h2>
                      </div>
                    </div>
                    <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.75)', fontStyle: 'italic' }}>{prog.fullName}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.9)', background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '4px 14px', border: '0.5px solid rgba(255,255,255,0.25)' }}>
                      {prog.funder}
                    </span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{prog.period}</span>
                  </div>
                </div>
              </div>

              {/* Programme body */}
              <div style={{ padding: '28px 32px' }}>

                {/* Meta info */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginBottom: 24, paddingBottom: 20, borderBottom: '0.5px solid #F0EDF8' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 10, color: '#aaa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Coverage</p>
                    <p style={{ margin: 0, fontSize: 13, color: '#444', fontWeight: 500 }}>{prog.coverage}</p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 10, color: '#aaa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Districts</p>
                    <p style={{ margin: 0, fontSize: 13, color: '#444', fontWeight: 500 }}>{prog.districts}</p>
                  </div>
                  {prog.diagnostician && (
                    <div>
                      <p style={{ margin: 0, fontSize: 10, color: '#aaa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Diagnostician</p>
                      <p style={{ margin: 0, fontSize: 13, color: '#444', fontWeight: 500 }}>{prog.diagnostician}</p>
                    </div>
                  )}
                </div>

                <p style={{ margin: '0 0 22px', fontSize: 14, color: '#555', lineHeight: 1.75 }}>{prog.summary}</p>

                {/* Sectors */}
                <div style={{ marginBottom: 24 }}>
                  <p style={{ margin: '0 0 10px', fontSize: 10, color: '#aaa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Sectors covered</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {prog.sectors.map(s => (
                      <span key={s} style={{ fontSize: 12, fontWeight: 600, color: prog.textAccent, background: prog.accentColor, borderRadius: 20, padding: '3px 11px' }}>{s}</span>
                    ))}
                  </div>
                </div>

                {/* Businesses table */}
                <div>
                  <p style={{ margin: '0 0 12px', fontSize: 10, color: '#aaa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Businesses diagnosed — {prog.businesses.length} {prog.businesses.length === 1 ? 'entry' : 'entries'}
                    {prog.note ? '' : ''}
                  </p>
                  <div style={{ background: '#FAFAFA', borderRadius: 12, border: '0.5px solid #EEEBF7', overflow: 'hidden' }}>
                    <table className="biz-table">
                      <thead>
                        <tr style={{ background: '#F4F2FC' }}>
                          <th style={{ color: '#888', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8 }}>Ref</th>
                          <th style={{ color: '#888', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8 }}>Business / Organisation</th>
                          <th style={{ color: '#888', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8 }}>Type</th>
                          <th style={{ color: '#888', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8 }}>Sector / Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prog.businesses.map((biz: any) => (
                          <>
                            <tr key={biz.id} style={{ background: '#fff' }}>
                              <td style={{ color: '#aaa', fontFamily: 'monospace', fontSize: 11, whiteSpace: 'nowrap' }}>{biz.id}</td>
                              <td>
                                <span style={{ fontWeight: 600, color: '#2D1B5E', fontSize: 13 }}>{biz.name}</span>
                                {biz.note && <span style={{ marginLeft: 8, fontSize: 11, color: '#999' }}>· {biz.note}</span>}
                              </td>
                              <td>
                                <span style={{ fontSize: 11, fontWeight: 600, color: prog.textAccent, background: prog.accentColor, borderRadius: 20, padding: '2px 9px' }}>{biz.type}</span>
                              </td>
                              <td style={{ color: '#666', fontSize: 12 }}>{biz.sector}</td>
                            </tr>
                            {biz.isCooperative && biz.members && biz.members.map((m: string) => (
                              <tr key={m} style={{ background: '#FDFCFF' }}>
                                <td style={{ color: '#ccc', fontSize: 11, paddingLeft: 24 }}>↳</td>
                                <td colSpan={3} style={{ fontSize: 12, color: '#666', paddingLeft: 24, fontStyle: 'italic' }}>{m}</td>
                              </tr>
                            ))}
                          </>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {prog.note && (
                    <p style={{ margin: '10px 0 0', fontSize: 12, color: '#aaa', fontStyle: 'italic', paddingLeft: 4 }}>
                      ⚠ {prog.note}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER CTA */}
      <section style={{ background: `linear-gradient(135deg, ${PD} 0%, ${P} 60%, ${BD} 100%)`, padding: '64px 28px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 30, fontWeight: 800, color: '#fff', margin: '0 0 14px', letterSpacing: -0.6, lineHeight: 1.15 }}>Want to deploy BizReady in your programme?</h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.68)', marginBottom: 28, lineHeight: 1.65 }}>
            BizReady packages Innovation SL&apos;s proven TNAD diagnostic methodology into a scalable digital platform for banks, development finance institutions, and accelerators.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/contact" style={{ padding: '12px 26px', borderRadius: 11, background: '#fff', color: P, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>Get in touch →</Link>
            <Link href="/about" style={{ padding: '12px 26px', borderRadius: 11, background: 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: 600, fontSize: 14, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.25)' }}>← Back to About</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
