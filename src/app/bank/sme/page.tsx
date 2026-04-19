// src/app/bank/sme/page.tsx
// Server component - SME profiles directory with card grid + client-side search

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { connectDB } from '@/lib/db'
import { User, Tenant, Business, Diagnostic } from '@/models'
import SMESearchGrid from './SMESearchGrid'

// ── HELPERS ───────────────────────────────────────────────
function classifyIndex(index: number) {
  if (index >= 80) return { label: 'Investment Ready',       color: '#0F6E56', bg: '#E1F5EE' }
  if (index >= 60) return { label: 'Conditionally Lendable', color: '#BA7517', bg: '#FAEEDA' }
  return           { label: 'High Risk',                     color: '#A32D2D', bg: '#FCEBEB' }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() || '')
    .join('')
}

// Deterministic colour per CEO initials (for avatar)
const AVATAR_PALETTE = [
  '#185FA5', '#0F6E56', '#5B1FA8', '#BA7517', '#A32D2D',
  '#0369A1', '#7C3AED', '#B45309', '#1D4ED8', '#047857',
]
function avatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length]
}

// ── SERIALISABLE CARD TYPE ────────────────────────────────
export interface SMECardData {
  businessId:       string
  name:             string
  ceoName:          string
  ceoInitials:      string
  avatarColor:      string
  sector:           string
  latestScore:      number | null
  classification:   { label: string; color: string; bg: string } | null
  taStatus:         string
  dateJoined:       string
  location:         string
  diagnosticCount:  number
}

// ── PAGE COMPONENT ────────────────────────────────────────
export default async function SMEPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  await connectDB()

  const user = await User.findOne({ clerkId: userId }).lean() as any
  if (!user) redirect('/onboarding')

  const tenantId = user.tenantId
  const tenant   = await Tenant.findById(tenantId).lean() as any
  if (!tenant) redirect('/onboarding')

  const theme    = tenant.theme
  const bankName = theme.bankName || 'BizReady'

  // Fetch all businesses for this tenant
  const businesses = await Business.find({ tenantId })
    .sort({ createdAt: -1 })
    .lean() as any[]

  if (businesses.length === 0) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">SME Profiles</h1>
          <p className="text-sm text-gray-500 mt-1">{bankName} · Business portfolio</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-9 h-9 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">No SME profiles yet</h2>
          <p className="text-sm text-gray-500 mb-8 max-w-md mx-auto">
            SME profiles are created automatically when businesses complete their diagnostic assessment.
          </p>
          <div className="inline-flex items-center gap-3 px-6 py-4 bg-gray-50 rounded-xl border border-gray-100">
            <span className="text-xs font-medium text-gray-500">Diagnostic link</span>
            <code className="text-sm font-mono text-gray-700 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
              {process.env.NEXT_PUBLIC_APP_URL || 'https://bizready.app'}/diagnostic/{tenant.slug}
            </code>
          </div>
        </div>
      </div>
    )
  }

  // Fetch latest scored diagnostic for each business in one query
  // Group by businessId, take the most recent scored/reported one
  const latestDiagnostics = await Diagnostic.aggregate([
    {
      $match: {
        tenantId: businesses[0].tenantId,
        businessId: { $in: businesses.map((b: any) => b._id) },
        status: { $in: ['submitted', 'scored', 'reported'] },
        'result.lendabilityIndex': { $exists: true },
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$businessId',
        lendabilityIndex: { $first: '$result.lendabilityIndex' },
        classification:   { $first: '$result.classification' },
        diagnosticCount:  { $sum: 1 },
      },
    },
  ])

  // Build a map for O(1) lookup
  const diagMap = new Map<string, { lendabilityIndex: number; classification: string; diagnosticCount: number }>()
  for (const d of latestDiagnostics) {
    diagMap.set(String(d._id), {
      lendabilityIndex: d.lendabilityIndex,
      classification:   d.classification,
      diagnosticCount:  d.diagnosticCount,
    })
  }

  // Build serialisable card data
  const cards: SMECardData[] = businesses.map((biz: any) => {
    const diag           = diagMap.get(String(biz._id))
    const score          = diag?.lendabilityIndex ?? null
    const classifRaw     = diag?.classification   ?? null
    const classifStyle   = score !== null ? classifyIndex(score) : null

    const dateJoined = biz.createdAt
      ? new Date(biz.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : '-'

    return {
      businessId:      String(biz._id),
      name:            biz.name,
      ceoName:         biz.ceoName,
      ceoInitials:     getInitials(biz.ceoName),
      avatarColor:     avatarColor(biz.ceoName),
      sector:          biz.sector,
      latestScore:     score,
      classification:  classifStyle,
      taStatus:        biz.taStatus || 'none',
      dateJoined,
      location:        biz.district || biz.location || biz.country || '',
      diagnosticCount: diag?.diagnosticCount ?? 0,
    }
  })

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SME Profiles</h1>
          <p className="text-sm text-gray-500 mt-1">
            {bankName} · {businesses.length} business{businesses.length !== 1 ? 'es' : ''} in portfolio
          </p>
        </div>
        <Link
          href="/bank/submissions"
          className="text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
        >
          View Submissions →
        </Link>
      </div>

      {/* Search + grid - client component receives pre-fetched data */}
      <SMESearchGrid cards={cards} primaryColor={theme.primary} />
    </div>
  )
}
