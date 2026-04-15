// src/app/onboarding/setup-required/page.tsx
// Shown when the database has not been seeded yet

export default function SetupRequired() {
  return (
    <div style={{
      minHeight: '100vh', background: '#F8F7FF',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, border: '0.5px solid #EDE9FE',
        padding: 40, maxWidth: 480, width: '100%', textAlign: 'center',
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 12,
          background: '#EDE9FE', display: 'flex', alignItems: 'center',
          justifyContent: 'center', margin: '0 auto 20px', fontSize: 24,
        }}>
          ⚙️
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: '#1F1535', marginBottom: 10 }}>
          Platform setup required
        </h1>
        <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7, marginBottom: 24 }}>
          The BizReady database has not been initialised yet. Run the seed script
          to create the required tenants and question bank, then sign in again.
        </p>
        <div style={{
          background: '#1F1535', borderRadius: 10, padding: '14px 20px',
          textAlign: 'left', marginBottom: 24,
        }}>
          <code style={{ color: '#9FE1CB', fontSize: 13 }}>npm run seed</code>
        </div>
        <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 20 }}>
          Also make sure <code style={{ background: '#F3F4F6', padding: '1px 6px', borderRadius: 4 }}>
            PLATFORM_ADMIN_EMAILS=platformlead@innosldigital.com
          </code> is set in your <code style={{ background: '#F3F4F6', padding: '1px 6px', borderRadius: 4 }}>.env.local</code> file.
        </p>
        <a href="/sign-in" style={{
          display: 'inline-block', padding: '10px 28px', borderRadius: 9,
          background: '#5B1FA8', color: '#fff', textDecoration: 'none',
          fontSize: 14, fontWeight: 500,
        }}>
          Back to sign in
        </a>
      </div>
    </div>
  )
}