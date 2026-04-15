// src/lib/db/seed.ts
// Run with: npm run seed
// Seeds the database with initial tenants, question bank sections, and questions

import mongoose from 'mongoose'
import { Tenant, DiagnosticSection, Question } from '../../models/index.js'
import { BANK_PRESETS } from '../../types/index.js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const MONGODB_URI = process.env.MONGODB_URI as string
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in .env.local')
  process.exit(1)
}

async function seed() {
  console.log('🌱 Seeding BizReady database...')
  await mongoose.connect(MONGODB_URI, {
    dbName: process.env.DB_NAME || 'bizready'
  })

  // Drop the old clerkOrgId_1 unique index if it exists (allows re-seeding without duplicate key errors)
  try {
    await Tenant.collection.dropIndex('clerkOrgId_1')
    console.log('✓ Dropped old clerkOrgId_1 unique index')
  } catch (err: any) {
    if (err.code !== 27) throw err  // 27 = index not found — that's fine
  }

  // ── TENANTS ────────────────────────────────────────────
  console.log('Creating tenants...')
  const tenants = [
    {
      slug: 'uba-sl', name: 'UBA Sierra Leone',
      theme: BANK_PRESETS.uba, plan: 'growth',
      clerkOrgId: 'org_placeholder_uba',
      country: 'Sierra Leone', region: 'West Africa',
      contactEmail: 'diagnostics@uba.sl',
    },
    {
      slug: 'slcb', name: 'Sierra Leone Commercial Bank',
      theme: BANK_PRESETS.slcb, plan: 'growth',
      clerkOrgId: 'org_placeholder_slcb',
      country: 'Sierra Leone', region: 'West Africa',
      contactEmail: 'info@slcb.sl',
    },
    {
      slug: 'rokel', name: 'Rokel Commercial Bank',
      theme: BANK_PRESETS.rokel, plan: 'starter',
      clerkOrgId: 'org_placeholder_rokel',
      country: 'Sierra Leone', region: 'West Africa',
      contactEmail: 'info@rokelbank.sl',
    },
    {
      slug: 'innosl', name: 'BizReady Platform',
      theme: BANK_PRESETS.innosl, plan: 'owner',
      clerkOrgId: 'org_placeholder_innosl',
      country: 'Sierra Leone', region: 'West Africa',
      contactEmail: 'fsg@innosl.com',
    },
  ]

  for (const t of tenants) {
    // Omit clerkOrgId from upsert data to prevent unique constraint issues
    const { clerkOrgId: _omit, ...tenantData } = t
    void _omit
    await Tenant.findOneAndUpdate({ slug: t.slug }, tenantData, { upsert: true, new: true })
    console.log(`  ✓ Tenant: ${t.name}`)
  }

  // ── DIAGNOSTIC SECTIONS ────────────────────────────────
  console.log('\nCreating diagnostic sections...')

  const sections = [
    { name: 'Business information', description: 'Basic company profile and loan context.', capacityLevel: 'info', weight: 0, maxPoints: 0, order: 1 },
    { name: 'Strategic capacity',   description: 'Assesses leadership, planning, and business direction.',      capacityLevel: 'strategic',   weight: 0.30, maxPoints: 35, order: 2 },
    { name: 'Operational capacity', description: 'Production, sales, market reach, and service delivery.',      capacityLevel: 'operational', weight: 0.45, maxPoints: 40, order: 3 },
    { name: 'Support capacity',     description: 'Finance, HR, compliance, and organisational systems.',        capacityLevel: 'support',     weight: 0.25, maxPoints: 40, order: 4 },
    { name: 'Final questions',      description: 'Business context and programme history.',                    capacityLevel: 'final',       weight: 0, maxPoints: 0, order: 5 },
  ]

  const sectionDocs: any[] = []
  for (const s of sections) {
    const doc = await DiagnosticSection.findOneAndUpdate(
      { name: s.name }, s, { upsert: true, new: true }
    )
    sectionDocs.push(doc)
    console.log(`  ✓ Section: ${s.name}`)
  }

  // ── QUESTIONS ──────────────────────────────────────────
  console.log('\nCreating questions...')
  const strategicSectionId = sectionDocs[1]._id
  const operationalSectionId = sectionDocs[2]._id
  const supportSectionId = sectionDocs[3]._id

  const questions = [
    // STRATEGIC
    {
      sectionId: strategicSectionId, order: 1, type: 'mcq', isRequired: true, isActive: true,
      text: 'Does your business have a written business plan or growth strategy?',
      hint: 'This can be a formal document or a structured written plan covering 1–5 years ahead.',
      options: [
        { text: 'Yes — a formal, detailed written business plan', score: 5 },
        { text: 'Yes — an informal or brief written plan', score: 3 },
        { text: 'No — we plan verbally but nothing is written', score: 1 },
        { text: 'No — we have no business plan', score: 0 },
      ],
    },
    {
      sectionId: strategicSectionId, order: 2, type: 'mcq', isRequired: true, isActive: true,
      text: 'How are major business decisions made in your company?',
      hint: 'This helps assess key-man risk — whether the business depends entirely on one person.',
      options: [
        { text: 'Decisions are shared across a formal management team', score: 5 },
        { text: 'One main person decides but consults the team regularly', score: 3 },
        { text: 'One main person makes most decisions with little consultation', score: 1 },
        { text: 'One person makes all decisions alone', score: 0 },
      ],
    },
    {
      sectionId: strategicSectionId, order: 3, type: 'mcq', isRequired: true, isActive: true,
      text: 'Is your business fully registered with a valid business license?',
      hint: '',
      options: [
        { text: 'Yes — fully registered as an LLC or similar, with a valid license', score: 5 },
        { text: 'Yes — registered but license is expired or pending renewal', score: 3 },
        { text: 'Partially — registration is in progress', score: 2 },
        { text: 'No — the business is not formally registered', score: 0 },
      ],
    },
    {
      sectionId: strategicSectionId, order: 4, type: 'mcq', isRequired: true, isActive: true,
      text: 'Has your business been profitable in the last two years?',
      hint: 'If COVID significantly affected your business, reflect on the two years before that period.',
      options: [
        { text: 'Yes — profitable in both of the last two years', score: 5 },
        { text: 'Yes — profitable in one of the last two years', score: 3 },
        { text: 'We broke even — neither profit nor loss', score: 2 },
        { text: 'No — we have been operating at a loss', score: 0 },
      ],
    },
    {
      sectionId: strategicSectionId, order: 5, type: 'scale', isRequired: true, isActive: true,
      text: 'How would you rate the overall management capability of your business?',
      hint: 'Be honest — this helps us identify the right Technical Assistance for your team.',
      options: [
        { text: '1 — Managerial workforce with limited skills and no clear vision', score: 1 },
        { text: '2 — Limited skills but some understanding of vision and growth plans', score: 2 },
        { text: '3 — Some skills, understands vision, may need support to implement', score: 3 },
        { text: '4 — Strong team, able to articulate vision, limited support needed', score: 4 },
        { text: '5 — Excellent team with full capability to implement growth plans independently', score: 5 },
      ],
    },
    // OPERATIONAL
    {
      sectionId: operationalSectionId, order: 1, type: 'mcq', isRequired: true, isActive: true,
      text: 'Are your production or service delivery levels running above 75% of your capacity?',
      hint: 'i.e. you are using most of your available equipment, staff time, and facilities.',
      options: [
        { text: 'Yes — consistently operating above 75% capacity', score: 5 },
        { text: 'Around 50–75% of capacity', score: 3 },
        { text: 'Below 50% of capacity', score: 1 },
        { text: 'We have never measured this', score: 0 },
      ],
    },
    {
      sectionId: operationalSectionId, order: 2, type: 'mcq', isRequired: true, isActive: true,
      text: 'Does your business have a quality management or quality assurance system?',
      hint: 'This includes any documented processes to check and maintain the quality of your products/services.',
      options: [
        { text: 'Yes — a formal QA system with written documentation and regular checks', score: 5 },
        { text: 'Yes — informal quality checks that staff follow regularly', score: 3 },
        { text: 'We check quality occasionally but have no system', score: 1 },
        { text: 'No quality management system is in place', score: 0 },
      ],
    },
    {
      sectionId: operationalSectionId, order: 3, type: 'mcq', isRequired: true, isActive: true,
      text: 'Does your business have a documented sales and marketing strategy?',
      hint: '',
      options: [
        { text: 'Yes — a written strategy covering multiple sales channels and marketing activities', score: 5 },
        { text: 'Yes — a basic written plan for sales', score: 3 },
        { text: 'We have an approach but it is not written down', score: 1 },
        { text: 'No — we have no defined sales strategy', score: 0 },
      ],
    },
    {
      sectionId: operationalSectionId, order: 4, type: 'mcq', isRequired: true, isActive: true,
      text: 'Does your business sell beyond your immediate local area?',
      hint: '',
      options: [
        { text: 'Yes — we export to international markets', score: 5 },
        { text: 'Yes — we sell nationally across Sierra Leone', score: 4 },
        { text: 'Yes — we sell in multiple cities or districts', score: 3 },
        { text: 'No — we sell only in our immediate local area', score: 1 },
      ],
    },
    // SUPPORT
    {
      sectionId: supportSectionId, order: 1, type: 'mcq', isRequired: true, isActive: true,
      text: 'How does your business keep its financial records?',
      hint: '⚠️ This is the single most important question for your lendability score.',
      options: [
        { text: 'We use a digital accounting software (e.g. QuickBooks, Wave, Sage)', score: 5 },
        { text: 'We use Microsoft Excel or Google Sheets', score: 3 },
        { text: 'We record finances manually in a book or register', score: 1 },
        { text: 'We do not keep formal financial records', score: 0 },
      ],
    },
    {
      sectionId: supportSectionId, order: 2, type: 'mcq', isRequired: true, isActive: true,
      text: 'Does your business prepare monthly or quarterly management accounts?',
      hint: 'Management accounts show income, expenses, profit/loss and cash flow for a period.',
      options: [
        { text: 'Yes — formal management accounts prepared every month', score: 5 },
        { text: 'Yes — every quarter', score: 4 },
        { text: 'Occasionally — but not on a regular schedule', score: 2 },
        { text: 'No — we have never prepared management accounts', score: 0 },
      ],
    },
    {
      sectionId: supportSectionId, order: 3, type: 'mcq', isRequired: true, isActive: true,
      text: 'Are your personal finances completely separate from your business finances?',
      hint: 'This is a critical corporate governance indicator for lenders.',
      options: [
        { text: 'Yes — completely separate bank accounts and no mixing of funds', score: 5 },
        { text: 'Mostly separate — occasional personal use of business funds', score: 3 },
        { text: 'Partially — we are working on separating them', score: 2 },
        { text: 'No — personal and business money is mixed together', score: 0 },
      ],
    },
    {
      sectionId: supportSectionId, order: 4, type: 'mcq', isRequired: true, isActive: true,
      text: 'Does your business have a written HR policy or human resource strategy?',
      hint: '',
      options: [
        { text: 'Yes — a written HR policy that is actively implemented', score: 5 },
        { text: 'Yes — a written policy but not consistently followed', score: 3 },
        { text: 'No — we manage HR informally', score: 1 },
        { text: 'No — we have no HR practices in place', score: 0 },
      ],
    },
  ]

  for (const q of questions) {
    await Question.findOneAndUpdate(
      { sectionId: q.sectionId, text: q.text },
      q, { upsert: true, new: true }
    )
    console.log(`  ✓ Question: ${q.text.slice(0, 60)}...`)
  }

  console.log('\n✅ Seed complete!')
  await mongoose.disconnect()
}

seed().catch(console.error)
