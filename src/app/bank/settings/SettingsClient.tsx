'use client'
// src/app/bank/settings/SettingsClient.tsx
// Client component - handles all interactive tabs/forms

import { FormEvent, useState } from 'react'

const BASE_TABS = ['Profile', 'Branding', 'Notifications', 'Team', 'Diagnostic Link', 'Billing'] as const
type BaseTab = (typeof BASE_TABS)[number]
type Tab = BaseTab | 'Scoring' | 'API Keys'

const FONT_OPTIONS = ['Inter', 'Georgia', 'Roboto', 'Lato']

interface SettingsClientProps {
  tenant: {
    _id: string
    slug: string
    name: string
    plan: string
    contactEmail: string
    country: string
    submissionsThisMonth: number
    totalSubmissions: number
    scoringWeights?: { strategic: number; process: number; support: number }
    customDomain?: string
    successManagerName?: string
    successManagerEmail?: string
    theme: {
      primary: string
      primaryLight: string
      primaryDark: string
      accent: string
      fontFamily: string
      logoUrl?: string
      bankName: string
      abbreviation: string
      tagline?: string
    }
  }
}

export default function SettingsClient({ tenant }: SettingsClientProps) {
  const isEnterprise = tenant.plan === 'enterprise' || tenant.plan === 'owner'
  const TABS: Tab[] = [...BASE_TABS, ...(isEnterprise ? ['Scoring' as Tab, 'API Keys' as Tab] : [])]

  const [activeTab, setActiveTab] = useState<Tab>('Profile')

  function handleTabChange(tab: Tab) {
    setActiveTab(tab)
    if (tab === 'API Keys' && !apiKeysLoaded) loadApiKeys()
  }
  const [copied, setCopied] = useState(false)
  const [copiedSubdomain, setCopiedSubdomain] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')

  // Scoring weights state (enterprise)
  const defaultWeights = tenant.scoringWeights ?? { strategic: 0.30, process: 0.45, support: 0.25 }
  const [weights, setWeights] = useState(defaultWeights)
  const [weightsError, setWeightsError] = useState('')
  const [weightsSuccess, setWeightsSuccess] = useState('')
  const [isSavingWeights, setIsSavingWeights] = useState(false)
  const weightsSum = Math.round((weights.strategic + weights.process + weights.support) * 100) / 100

  async function handleWeightsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setWeightsError('')
    setWeightsSuccess('')
    if (Math.abs(weightsSum - 1) > 0.001) {
      setWeightsError(`Weights must sum to 1.00 (currently ${weightsSum.toFixed(2)})`)
      return
    }
    setIsSavingWeights(true)
    try {
      const res = await fetch('/api/bank/scoring-weights', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(weights),
      })
      const payload = await res.json()
      if (!res.ok) { setWeightsError(payload.error || 'Failed to save weights.'); return }
      setWeightsSuccess('Scoring weights saved. Future diagnostics will use the new weights.')
    } catch {
      setWeightsError('Unable to save weights right now.')
    } finally {
      setIsSavingWeights(false)
    }
  }

  // Custom domain state (growth+)
  const PLAN_ORDER = ['starter', 'growth', 'enterprise', 'owner']
  const isGrowthPlus = PLAN_ORDER.indexOf(tenant.plan) >= PLAN_ORDER.indexOf('growth')
  const [customDomain, setCustomDomain] = useState(tenant.customDomain ?? '')
  const [domainSaving, setDomainSaving] = useState(false)
  const [domainError, setDomainError]   = useState('')
  const [domainSuccess, setDomainSuccess] = useState('')

  async function handleDomainSave() {
    setDomainError('')
    setDomainSuccess('')
    setDomainSaving(true)
    try {
      const res  = await fetch('/api/bank/custom-domain', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customDomain: customDomain || null }) })
      const data = await res.json()
      if (!res.ok) { setDomainError(data.error || 'Failed to save domain.'); return }
      setDomainSuccess(customDomain ? `Custom domain saved. Point your CNAME to bizready.io to complete setup.` : 'Custom domain removed.')
    } catch { setDomainError('Unable to save domain right now.') }
    finally { setDomainSaving(false) }
  }

  // API Keys state (enterprise)
  const [apiKeys, setApiKeys] = useState<{ _id: string; name: string; keyPrefix: string; createdAt: string; lastUsedAt?: string }[]>([])
  const [apiKeysLoaded, setApiKeysLoaded] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyResult, setNewKeyResult] = useState<string | null>(null)
  const [apiKeyError, setApiKeyError] = useState('')
  const [isCreatingKey, setIsCreatingKey] = useState(false)

  async function loadApiKeys() {
    const res  = await fetch('/api/keys')
    const data = await res.json()
    if (data.success) setApiKeys(data.data)
    setApiKeysLoaded(true)
  }

  async function handleCreateKey() {
    if (!newKeyName.trim()) return
    setApiKeyError('')
    setNewKeyResult(null)
    setIsCreatingKey(true)
    try {
      const res  = await fetch('/api/keys', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newKeyName.trim() }) })
      const data = await res.json()
      if (!res.ok) { setApiKeyError(data.error || 'Failed to create key.'); return }
      setNewKeyResult(data.data.key)
      setNewKeyName('')
      loadApiKeys()
    } catch {
      setApiKeyError('Unable to create key right now.')
    } finally {
      setIsCreatingKey(false)
    }
  }

  async function handleRevokeKey(id: string) {
    if (!confirm('Revoke this API key? Any integrations using it will stop working immediately.')) return
    await fetch(`/api/keys?id=${id}`, { method: 'DELETE' })
    setApiKeys(keys => keys.filter(k => k._id !== id))
  }

  // Team invite state
  const [inviteEmail, setInviteEmail]     = useState('')
  const [inviteRole, setInviteRole]       = useState<'bank_staff' | 'bank_admin'>('bank_staff')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState('')
  const [inviteError, setInviteError]     = useState('')
  const [teamMembers, setTeamMembers]     = useState<{ _id: string; name?: string; email: string; role: string }[] | null>(null)

  async function loadTeamMembers() {
    const res  = await fetch('/api/bank/team')
    const data = await res.json()
    if (data.members) setTeamMembers(data.members)
  }

  async function handleInvite() {
    setInviteError('')
    setInviteSuccess('')
    if (!inviteEmail.trim()) return
    setInviteLoading(true)
    try {
      const res  = await fetch('/api/bank/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      })
      const data = await res.json()
      if (!res.ok) { setInviteError(data.error || 'Failed to send invitation.'); return }
      setInviteSuccess(`Invitation sent to ${inviteEmail.trim()}. They'll receive an email to join.`)
      setInviteEmail('')
    } catch {
      setInviteError('Unable to send invitation right now.')
    } finally {
      setInviteLoading(false)
    }
  }

  const [profileForm, setProfileForm] = useState({
    bankName: tenant.theme.bankName,
    contactEmail: tenant.contactEmail,
    country: tenant.country,
    tagline: tenant.theme.tagline ?? '',
  })

  const diagnosticUrl = `https://bizready.io/diagnostic/${tenant.slug}`
  const planMeta: Record<string, { price: number; limit: number | null }> = {
    starter: { price: 299, limit: 50 },
    growth: { price: 899, limit: 200 },
    enterprise: { price: 2500, limit: null },
    owner: { price: 0, limit: null },
  }
  const currentPlan = planMeta[tenant.plan] ?? planMeta.starter
  const usageLimit = currentPlan.limit
  const usagePercent = usageLimit ? Math.min(100, Math.round((tenant.submissionsThisMonth / usageLimit) * 100)) : 0

  function handleCopy() {
    navigator.clipboard.writeText(diagnosticUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSavingProfile(true)
    setProfileError('')
    setProfileSuccess('')

    try {
      const response = await fetch('/api/bank/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      })

      const payload = await response.json()

      if (!response.ok) {
        setProfileError(payload.error || 'Failed to save settings.')
        return
      }

      setProfileForm((current) => ({
        ...current,
        bankName: payload.tenant?.theme?.bankName ?? current.bankName,
        contactEmail: payload.tenant?.contactEmail ?? current.contactEmail,
        country: payload.tenant?.country ?? current.country,
        tagline: payload.tenant?.theme?.tagline ?? current.tagline,
      }))
      setProfileSuccess('Settings saved successfully.')
    } catch {
      setProfileError('Unable to save settings right now.')
    } finally {
      setIsSavingProfile(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Settings</h1>
        <p className="text-sm text-gray-500">Manage your organisation profile and preferences</p>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap border-b border-gray-200 mb-8 gap-1">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={[
              'px-4 py-2.5 text-sm font-medium rounded-t-md transition-colors whitespace-nowrap',
              activeTab === tab
                ? 'border-b-2 text-gray-900 bg-white -mb-px'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
            ].join(' ')}
            style={activeTab === tab ? { borderBottomColor: 'var(--primary, #5B1FA8)' } : {}}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── PROFILE TAB ── */}
      {activeTab === 'Profile' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-5">Organisation Profile</h2>
          <form onSubmit={handleProfileSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Bank / Organisation Name</label>
                <input
                  type="text"
                  value={profileForm.bankName}
                  onChange={event => setProfileForm(current => ({ ...current, bankName: event.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-0"
                  style={{ '--tw-ring-color': 'var(--primary, #5B1FA8)' } as React.CSSProperties}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Contact Email</label>
                <input
                  type="email"
                  value={profileForm.contactEmail}
                  onChange={event => setProfileForm(current => ({ ...current, contactEmail: event.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Country</label>
                <input
                  type="text"
                  value={profileForm.country}
                  onChange={event => setProfileForm(current => ({ ...current, country: event.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Tenant Slug</label>
                <div className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 bg-gray-50">
                  {tenant.slug}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Tagline</label>
                <input
                  type="text"
                  value={profileForm.tagline}
                  onChange={event => setProfileForm(current => ({ ...current, tagline: event.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2"
                />
              </div>
            </div>

            {/* Success manager */}
            {tenant.successManagerName && (
              <div className="rounded-lg border border-violet-100 bg-violet-50 px-4 py-3 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-violet-200 flex items-center justify-center text-violet-700 font-bold text-sm flex-shrink-0">
                  {tenant.successManagerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-semibold text-violet-900">Your Success Manager</p>
                  <p className="text-xs text-violet-700 mt-0.5">{tenant.successManagerName}</p>
                  <a href={`mailto:${tenant.successManagerEmail}`} className="text-xs text-violet-600 hover:underline">
                    {tenant.successManagerEmail}
                  </a>
                </div>
              </div>
            )}

            {profileError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {profileError}
              </div>
            )}

            {profileSuccess && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {profileSuccess}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-5 py-2 text-white rounded-lg text-sm font-medium shadow-sm hover:opacity-90 transition-opacity"
                style={{ background: 'var(--primary, #5B1FA8)' }}
              >
                {isSavingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── BRANDING TAB ── */}
      {activeTab === 'Branding' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Branding</h2>
          <p className="text-xs text-gray-400 mb-6">
            Branding is managed by the platform administrator. Contact InnovationSL to update your colours, logo, or fonts.
          </p>

          {/* Current theme preview */}
          <div className="space-y-5">
            <div>
              <p className="text-xs font-medium text-gray-700 mb-3">Current Colour Palette</p>
              <div className="flex gap-3 flex-wrap">
                {[
                  { label: 'Primary',       color: tenant.theme.primary },
                  { label: 'Primary Light', color: tenant.theme.primaryLight },
                  { label: 'Primary Dark',  color: tenant.theme.primaryDark },
                  { label: 'Accent',        color: tenant.theme.accent },
                ].map(({ label, color }) => (
                  <div key={label} className="flex flex-col items-center gap-1.5">
                    <div
                      className="w-12 h-12 rounded-lg border border-gray-200 shadow-sm"
                      style={{ background: color }}
                    />
                    <p className="text-[10px] text-gray-500 text-center">{label}</p>
                    <p className="text-[10px] font-mono text-gray-400">{color}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-700 mb-2">Font Family</p>
              <div className="flex gap-2 flex-wrap">
                {FONT_OPTIONS.map(font => (
                  <div
                    key={font}
                    className={[
                      'px-3 py-1.5 border rounded-lg text-xs',
                      tenant.theme.fontFamily === font
                        ? 'border-gray-400 text-gray-900 font-medium bg-gray-50'
                        : 'border-gray-200 text-gray-400',
                    ].join(' ')}
                    style={{ fontFamily: font }}
                  >
                    {font}
                    {tenant.theme.fontFamily === font && (
                      <span className="ml-1.5 text-[10px] text-emerald-600">✓ Active</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Portal URL section */}
            <div className="pt-4 border-t border-gray-100 space-y-5">
              <p className="text-xs font-medium text-gray-700">Portal & Diagnostic URLs</p>

              {/* Auto-generated subdomain — always available, no DNS needed */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Ready to use</span>
                </div>
                <p className="text-xs font-semibold text-gray-800 mb-0.5">Your BizReady Subdomain</p>
                <p className="text-[11px] text-gray-500 mb-3">
                  This URL works immediately — no setup required. Copy and share it with your colleagues or SME clients.
                </p>
                <div className="flex gap-2">
                  <div className="flex-1 px-3 py-2 bg-white border border-emerald-200 rounded-lg font-mono text-sm text-gray-700 truncate select-all">
                    {`https://${tenant.slug}.bizready.io`}
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`https://${tenant.slug}.bizready.io`)
                      setCopiedSubdomain(true)
                      setTimeout(() => setCopiedSubdomain(false), 2000)
                    }}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                    style={copiedSubdomain
                      ? { background: '#E1F5EE', color: '#0F6E56', border: '1px solid #0F6E56' }
                      : { background: 'var(--primary, #5B1FA8)', color: '#fff', border: '1px solid transparent' }
                    }
                  >
                    {copiedSubdomain ? '✓ Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-2">
                  Diagnostic link: <span className="font-mono">{`https://${tenant.slug}.bizready.io/diagnostic/${tenant.slug}`}</span>
                </p>
              </div>

              {/* Custom domain — Growth+ optional advanced feature */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs font-medium text-gray-700">Custom Domain</p>
                  <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Optional · Growth+ only</span>
                </div>
                {isGrowthPlus ? (
                  <>
                    <p className="text-[11px] text-gray-400 mb-3">
                      Already have your own domain? Enter it below, then ask your IT team to add a <span className="font-mono font-medium">CNAME</span> record pointing <span className="font-mono font-medium">{customDomain || 'yourdomain.com'}</span> → <span className="font-mono font-medium">bizready.io</span>.
                      Your BizReady subdomain above works without this step.
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. diagnostic.mybank.com"
                        value={customDomain}
                        onChange={e => setCustomDomain(e.target.value.trim())}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2"
                        style={{ '--tw-ring-color': 'var(--primary, #5B1FA8)' } as React.CSSProperties}
                      />
                      <button
                        onClick={handleDomainSave}
                        disabled={domainSaving}
                        className="px-4 py-2 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                        style={{ background: 'var(--primary, #5B1FA8)' }}
                      >
                        {domainSaving ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                    {domainError   && <p className="text-xs text-red-600 mt-2">{domainError}</p>}
                    {domainSuccess && <p className="text-xs text-emerald-700 mt-2">{domainSuccess}</p>}
                    {customDomain && !domainError && !domainSuccess && (
                      <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-[11px] text-amber-800">
                        <p className="font-semibold mb-0.5">DNS setup required for <span className="font-mono">{customDomain}</span></p>
                        <p>Ask your IT team or domain registrar to add:</p>
                        <code className="block mt-1 bg-white border border-amber-200 rounded px-2 py-1 font-mono text-[10px]">
                          CNAME &nbsp; {customDomain} &nbsp; → &nbsp; bizready.io
                        </code>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-xs text-gray-500">
                    Custom domains are available on the <span className="font-semibold text-gray-700">Growth plan</span> and above.{' '}
                    <button className="underline hover:text-gray-700" onClick={() => handleTabChange('Billing')}>Upgrade →</button>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                To update your brand colours, logo, or fonts, contact{' '}
                <a href="mailto:support@innovationsl.com" className="underline hover:text-gray-600">
                  support@innovationsl.com
                </a>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── NOTIFICATIONS TAB ── */}
      {activeTab === 'Notifications' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Notification Preferences</h2>
          <p className="text-xs text-gray-400 mb-6">
            Choose which events trigger email notifications to your contact address.
          </p>

          <div className="space-y-1">
            {[
              {
                id: 'new_submission',
                label: 'New Submission Alert',
                description: 'Receive an email when an SME submits a new diagnostic',
                defaultChecked: true,
              },
              {
                id: 'high_risk_alert',
                label: 'High Risk Alert',
                description: 'Receive an immediate alert when a submission is scored as High Risk',
                defaultChecked: true,
              },
              {
                id: 'ta_completion',
                label: 'TA Completion Alert',
                description: 'Notify when a technical assistance programme is marked as completed',
                defaultChecked: false,
              },
              {
                id: 'monthly_summary',
                label: 'Monthly Summary',
                description: 'Receive a monthly digest of submissions, scores, and programme progress',
                defaultChecked: true,
              },
            ].map(item => (
              <label
                key={item.id}
                className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  id={item.id}
                  defaultChecked={item.defaultChecked}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                </div>
              </label>
            ))}
          </div>

          <div className="pt-4 flex justify-end border-t border-gray-100 mt-4">
            <div className="text-xs text-gray-400">
              Notification persistence will be enabled after the messaging rules layer is completed.
            </div>
          </div>
        </div>
      )}

      {/* ── TEAM TAB ── */}
      {activeTab === 'Team' && (() => {
        if (teamMembers === null) loadTeamMembers()
        return (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-1">Team Members</h2>
            <p className="text-xs text-gray-400 mb-5">
              Manage who has access to your BizReady dashboard. Invite bank staff and admins.
            </p>

            {/* Invite form */}
            <div className="border border-dashed border-gray-200 rounded-xl p-5 bg-gray-50 mb-6">
              <p className="text-xs font-semibold text-gray-700 mb-3">Invite a new team member</p>
              <div className="flex gap-3 flex-wrap">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleInvite()}
                  placeholder="colleague@bank.com"
                  className="flex-1 min-w-[180px] px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-300"
                />
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as 'bank_staff' | 'bank_admin')}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none"
                >
                  <option value="bank_staff">Bank Staff</option>
                  <option value="bank_admin">Bank Admin</option>
                </select>
                <button
                  onClick={handleInvite}
                  disabled={inviteLoading || !inviteEmail.trim()}
                  className="px-4 py-2 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                  style={{ background: 'var(--primary, #5B1FA8)' }}
                >
                  {inviteLoading ? 'Sending…' : 'Send Invite'}
                </button>
              </div>
              {inviteSuccess && <p className="text-xs text-emerald-600 mt-2">{inviteSuccess}</p>}
              {inviteError   && <p className="text-xs text-red-500 mt-2">{inviteError}</p>}
              {!inviteSuccess && !inviteError && (
                <p className="text-[10px] text-gray-400 mt-2">
                  An email invitation will be sent. The user will be assigned their role automatically on sign-up.
                </p>
              )}
            </div>

            {/* Live team table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-400">Name</th>
                    <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-400">Email</th>
                    <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-400">Role</th>
                    <th className="py-2.5 px-3" />
                  </tr>
                </thead>
                <tbody>
                  {teamMembers === null ? (
                    <tr><td colSpan={4} className="py-6 text-center text-xs text-gray-400">Loading…</td></tr>
                  ) : teamMembers.length === 0 ? (
                    <tr><td colSpan={4} className="py-6 text-center text-xs text-gray-400">No team members yet.</td></tr>
                  ) : teamMembers.map(member => (
                    <tr key={member._id} className="border-b border-gray-50 last:border-0">
                      <td className="py-3 px-3 font-medium text-gray-900">{member.name ?? '—'}</td>
                      <td className="py-3 px-3 text-gray-500">{member.email}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-50 text-purple-700 capitalize">
                          {member.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right" />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        )
      })()}

      {/* ── DIAGNOSTIC LINK TAB ── */}
      {activeTab === 'Diagnostic Link' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Diagnostic Link</h2>
          <p className="text-xs text-gray-400 mb-6">
            Share this link with SMEs to collect diagnostic submissions for your organisation.
          </p>

          {/* URL display + copy */}
          <div className="mb-6">
            <p className="text-xs font-medium text-gray-700 mb-2">Public Diagnostic URL</p>
            <div className="flex gap-2">
              <div className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm text-gray-700 truncate">
                {diagnosticUrl}
              </div>
              <button
                onClick={handleCopy}
                className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors whitespace-nowrap"
                style={
                  copied
                    ? { background: '#E1F5EE', color: '#0F6E56', borderColor: '#0F6E56' }
                    : { background: 'var(--primary, #5B1FA8)', color: '#fff', borderColor: 'transparent' }
                }
              >
                {copied ? '✓ Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>

          {/* QR code placeholder */}
          <div className="mb-6">
            <p className="text-xs font-medium text-gray-700 mb-2">QR Code</p>
            <div className="w-32 h-32 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-300 gap-1">
              <div className="text-3xl">⊞</div>
              <p className="text-[10px] font-medium">QR coming soon</p>
            </div>
          </div>

          {/* Share buttons */}
          <div>
            <p className="text-xs font-medium text-gray-700 mb-2">Share via</p>
            <div className="flex gap-2 flex-wrap">
              {[
                { label: 'WhatsApp', href: `https://wa.me/?text=${encodeURIComponent(`Complete your business diagnostic: ${diagnosticUrl}`)}`, color: '#25D366' },
                { label: 'Email',    href: `mailto:?subject=Business Diagnostic&body=${encodeURIComponent(`Please complete your diagnostic here: ${diagnosticUrl}`)}`, color: '#4F46E5' },
                { label: 'SMS',      href: `sms:?body=${encodeURIComponent(`Complete your diagnostic: ${diagnosticUrl}`)}`, color: '#374151' },
              ].map(btn => (
                <a
                  key={btn.label}
                  href={btn.href}
                  target={btn.label !== 'Email' ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-opacity"
                  style={{ background: btn.color }}
                >
                  {btn.label}
                </a>
              ))}
            </div>
          </div>

          {/* Slug info */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Your organisation slug: <span className="font-mono text-gray-600">{tenant.slug}</span>
              {' - '}contact InnovationSL to change it.
            </p>
          </div>
        </div>
      )}

      {/* ── SCORING WEIGHTS TAB (Enterprise only) ── */}
      {activeTab === 'Scoring' && isEnterprise && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Custom Scoring Weights</h2>
          <p className="text-xs text-gray-400 mb-6">
            Adjust how each capacity level contributes to the Lendability Index. Weights must sum to exactly 1.00.
          </p>

          <form onSubmit={handleWeightsSubmit} className="space-y-6">
            {(['strategic', 'process', 'support'] as const).map(level => {
              const labels: Record<string, { name: string; desc: string; default: string }> = {
                strategic: { name: 'Strategic Capacity',  desc: 'Mission, leadership, business environment',  default: '0.30' },
                process:   { name: 'Process Capacity',    desc: 'Operations, sales, environmental management', default: '0.45' },
                support:   { name: 'Support Capacity',    desc: 'Finance, HR, quality, technology',            default: '0.25' },
              }
              const meta = labels[level]
              const pct  = Math.round(weights[level] * 100)
              return (
                <div key={level}>
                  <div className="flex justify-between items-baseline mb-1.5">
                    <div>
                      <span className="text-sm font-semibold text-gray-900">{meta.name}</span>
                      <span className="text-xs text-gray-400 ml-2">{meta.desc}</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">{pct}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="0.90"
                    step="0.01"
                    value={weights[level]}
                    onChange={e => setWeights(w => ({ ...w, [level]: parseFloat(e.target.value) }))}
                    className="w-full accent-purple-600"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                    <span>5%</span>
                    <span>Default: {meta.default}</span>
                    <span>90%</span>
                  </div>
                </div>
              )
            })}

            {/* Sum indicator */}
            <div className={[
              'rounded-lg px-4 py-3 text-sm font-medium flex justify-between',
              Math.abs(weightsSum - 1) < 0.001
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-red-50 text-red-700 border border-red-200',
            ].join(' ')}>
              <span>Total weight</span>
              <span>{Math.round(weightsSum * 100)}% {Math.abs(weightsSum - 1) < 0.001 ? '✓' : '— must equal 100%'}</span>
            </div>

            {weightsError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{weightsError}</div>
            )}
            {weightsSuccess && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{weightsSuccess}</div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <button
                type="button"
                className="text-sm text-gray-400 hover:text-gray-600"
                onClick={() => setWeights({ strategic: 0.30, process: 0.45, support: 0.25 })}
              >
                Reset to defaults
              </button>
              <button
                type="submit"
                disabled={isSavingWeights || Math.abs(weightsSum - 1) > 0.001}
                className="px-5 py-2 text-white rounded-lg text-sm font-medium shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'var(--primary, #5B1FA8)' }}
              >
                {isSavingWeights ? 'Saving...' : 'Save Weights'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── API KEYS TAB (Enterprise only) ── */}
      {activeTab === 'API Keys' && isEnterprise && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-1">API Keys</h2>
            <p className="text-xs text-gray-400 mb-6">
              Generate API keys to integrate BizReady with your internal systems. Keys are shown once — store them securely.
            </p>

            {/* Create new key */}
            <div className="border border-dashed border-gray-200 rounded-xl p-5 bg-gray-50 mb-6">
              <p className="text-xs font-semibold text-gray-700 mb-3">Create a new API key</p>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="e.g. Production Integration, CRM Sync"
                  value={newKeyName}
                  onChange={e => setNewKeyName(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': 'var(--primary, #5B1FA8)' } as React.CSSProperties}
                  onKeyDown={e => e.key === 'Enter' && handleCreateKey()}
                />
                <button
                  onClick={handleCreateKey}
                  disabled={isCreatingKey || !newKeyName.trim()}
                  className="px-4 py-2 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                  style={{ background: 'var(--primary, #5B1FA8)' }}
                >
                  {isCreatingKey ? 'Creating...' : 'Create Key'}
                </button>
              </div>
              {apiKeyError && <p className="text-xs text-red-600 mt-2">{apiKeyError}</p>}
            </div>

            {/* Newly created key — shown once */}
            {newKeyResult && (
              <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs font-semibold text-amber-800 mb-2">Copy your new API key — it will not be shown again.</p>
                <div className="flex gap-2 items-center">
                  <code className="flex-1 text-xs bg-white border border-amber-200 rounded-lg px-3 py-2 font-mono text-amber-900 break-all">
                    {newKeyResult}
                  </code>
                  <button
                    onClick={() => navigator.clipboard.writeText(newKeyResult)}
                    className="px-3 py-2 border border-amber-300 rounded-lg text-xs font-medium text-amber-800 bg-white hover:bg-amber-50 whitespace-nowrap"
                  >
                    Copy
                  </button>
                </div>
                <button onClick={() => setNewKeyResult(null)} className="text-[10px] text-amber-600 mt-2 underline">
                  I&apos;ve saved it — dismiss
                </button>
              </div>
            )}

            {/* Keys list */}
            {!apiKeysLoaded ? (
              <p className="text-sm text-gray-400">Loading keys…</p>
            ) : apiKeys.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No active API keys. Create one above.</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {apiKeys.map(k => (
                  <div key={k._id} className="flex items-center gap-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{k.name}</p>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{k.keyPrefix}••••••••••••••••••••••••••••••••</p>
                    </div>
                    <div className="text-right text-xs text-gray-400">
                      <p>Created {new Date(k.createdAt).toLocaleDateString('en-GB')}</p>
                      {k.lastUsedAt && <p>Last used {new Date(k.lastUsedAt).toLocaleDateString('en-GB')}</p>}
                    </div>
                    <button
                      onClick={() => handleRevokeKey(k._id)}
                      className="px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-xs font-medium hover:bg-red-50 transition-colors"
                    >
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                Include your key as a header: <code className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">Authorization: Bearer bzr_...</code>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── BILLING TAB ── */}
      {activeTab === 'Billing' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-1">Billing & Subscription</h2>
            <p className="text-xs text-gray-400 mb-6">Manage your BizReady plan and usage.</p>

            {/* Current plan */}
            <div className="border border-gray-200 rounded-xl p-5 mb-6 bg-gray-50">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide font-medium">Current Plan</p>
                  <p className="text-xl font-bold text-gray-900 capitalize">{tenant.plan}</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {usageLimit ? `Up to ${usageLimit} diagnostics/month` : 'Unlimited diagnostics'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    {currentPlan.price > 0 ? `$${currentPlan.price}` : 'Internal'}
                  </p>
                  <p className="text-xs text-gray-400">{currentPlan.price > 0 ? 'per month' : 'platform plan'}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Diagnostics used this month</span>
                  <span className="font-medium text-gray-700">— / 50</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div className="h-2 bg-emerald-500 rounded-full" style={{ width: `${usagePercent}%` }} />
                </div>
                <p className="text-[10px] text-gray-400 mt-2">
                  {usageLimit ? `${tenant.submissionsThisMonth} of ${usageLimit} diagnostics used this month` : `${tenant.submissionsThisMonth} diagnostics used this month`}
                </p>
                <p className="text-[10px] text-gray-400 mt-1">All-time diagnostics: {tenant.totalSubmissions}</p>
              </div>
            </div>

            {/* Plan options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[
                { name: 'Starter',    price: 299,  limit: '50 diagnostics/mo',     color: '#6B7280', current: tenant.plan === 'starter' },
                { name: 'Growth',     price: 899,  limit: '200 diagnostics/mo',    color: '#185FA5', current: tenant.plan === 'growth' },
                { name: 'Enterprise', price: 2500, limit: 'Unlimited diagnostics', color: '#5B1FA8', current: tenant.plan === 'enterprise' },
              ].map(plan => (
                <div
                  key={plan.name}
                  className={[
                    'border rounded-xl p-4 relative',
                    plan.current ? 'border-2 bg-gray-50' : 'border-gray-200 hover:border-gray-300',
                  ].join(' ')}
                  style={plan.current ? { borderColor: plan.color } : {}}
                >
                  {plan.current && (
                    <span
                      className="absolute -top-2.5 left-4 px-2 py-0.5 text-[10px] font-semibold text-white rounded-full"
                      style={{ background: plan.color }}
                    >
                      Current
                    </span>
                  )}
                  <p className="font-semibold text-gray-900">{plan.name}</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">${plan.price}<span className="text-xs font-normal text-gray-400">/mo</span></p>
                  <p className="text-xs text-gray-400 mt-1">{plan.limit}</p>
                  <button
                    type="button"
                    disabled={plan.current}
                    className={[
                      'mt-3 w-full py-1.5 rounded-lg text-xs font-medium transition-opacity',
                      plan.current
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'text-white hover:opacity-90',
                    ].join(' ')}
                    style={!plan.current ? { background: plan.color } : {}}
                    onClick={() => {
                      window.location.href = 'mailto:billing@innovationsl.com?subject=BizReady%20Plan%20Upgrade'
                    }}
                  >
                    {plan.current ? 'Current plan' : `Upgrade to ${plan.name}`}
                  </button>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-400">
              To upgrade, downgrade, or cancel, contact{' '}
              <a href="mailto:billing@innovationsl.com" className="underline hover:text-gray-600">
                billing@innovationsl.com
              </a>
              {' '}or visit the Stripe billing portal (coming soon).
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
