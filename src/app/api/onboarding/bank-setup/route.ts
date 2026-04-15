// src/app/api/onboarding/bank-setup/route.ts
// Creates a new Tenant for a bank_admin and updates their tenantId

export const dynamic = 'force-dynamic'

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { User, Tenant } from '@/models'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

// Derive primaryLight (70% lighter) and primaryDark (45% darker) from a hex color
function lighten(hex: string): string {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = Math.round(((n >> 16) & 255) + (255 - ((n >> 16) & 255)) * 0.70)
  const g = Math.round(((n >>  8) & 255) + (255 - ((n >>  8) & 255)) * 0.70)
  const b = Math.round(( n        & 255) + (255 - ( n        & 255)) * 0.70)
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`
}

function darken(hex: string): string {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = Math.round(((n >> 16) & 255) * 0.55)
  const g = Math.round(((n >>  8) & 255) * 0.55)
  const b = Math.round(( n        & 255) * 0.55)
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const {
      bankName, abbreviation, tagline, contactEmail,
      country, region, primaryColor, accentColor, fontFamily, logoUrl,
    } = body

    if (!bankName?.trim() || !abbreviation?.trim() || !contactEmail?.trim() || !primaryColor || !accentColor) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    await connectDB()

    // ── TEMPORARY INDEX FIX ──────────────────────────────
    // Drop the problematic clerkOrgId_1 index if it exists
    try {
      await Tenant.collection.dropIndex('clerkOrgId_1')
      console.log('[bank-setup] Dropped clerkOrgId_1 index')
    } catch (e: any) {
      if (e.code !== 27) console.warn('[bank-setup] Error dropping index:', e.message)
    }
    // ─────────────────────────────────────────────────────

    // Ensure caller is a bank_admin (super admins should not be here)
    const user = await User.findOne({ clerkId: userId })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    if (user.role !== 'bank_admin') {
      return NextResponse.json({ 
        error: `Forbidden: Your role is ${user.role}. Only bank_admins can perform this setup.` 
      }, { status: 403 })
    }

    // Generate a unique slug from the bank name
    let slug = slugify(bankName.trim())
    if (!slug) slug = `bank-${Date.now()}`
    
    // Check if slug is already taken
    const conflict = await Tenant.findOne({ slug })
    if (conflict) {
      slug = `${slug}-${Math.floor(Math.random() * 1000)}`
    }

    const tenant = await Tenant.create({
      slug,
      name:         bankName.trim(),
      theme: {
        primary:      primaryColor,
        primaryLight: lighten(primaryColor),
        primaryDark:  darken(primaryColor),
        accent:       accentColor,
        fontFamily:   fontFamily || 'Inter',
        logoUrl:      logoUrl?.trim() || '',
        bankName:     bankName.trim(),
        abbreviation: abbreviation.trim().toUpperCase().slice(0, 6),
        tagline:      tagline?.trim() || '',
      },
      plan:         'starter',
      country:      country?.trim()  || 'Sierra Leone',
      region:       region?.trim()   || 'West Africa',
      contactEmail: contactEmail.trim().toLowerCase(),
      isActive:     true,
    })

    // Point the user to their new tenant
    user.tenantId = tenant._id
    await user.save()

    return NextResponse.json({ success: true, tenantSlug: tenant.slug })
  } catch (error: any) {
    console.error('[bank-setup-api] Crash:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'An unexpected server error occurred' 
    }, { status: 500 })
  }
}
