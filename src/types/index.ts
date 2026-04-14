// ─────────────────────────────────────────────────────────
//  BizReady Platform — Core TypeScript Types
// ─────────────────────────────────────────────────────────

// ── BANK THEMES ──────────────────────────────────────────
export interface BankTheme {
  primary: string
  primaryLight: string
  primaryDark: string
  accent: string
  fontFamily: 'Inter' | 'Georgia' | 'Roboto' | 'Lato'
  logoUrl?: string
  bankName: string
  abbreviation: string
  tagline?: string
}

export const BANK_PRESETS: Record<string, BankTheme> = {
  uba: {
    primary: '#C8102E', primaryLight: '#FDE8EB', primaryDark: '#1A0005',
    accent: '#FFD700', fontFamily: 'Inter',
    bankName: 'UBA Sierra Leone', abbreviation: 'UBA',
    tagline: 'Your bank. Your partner.',
  },
  slcb: {
    primary: '#C8102E', primaryLight: '#FDE8EB', primaryDark: '#8B0000',
    accent: '#FFD700', fontFamily: 'Inter',
    bankName: 'Sierra Leone Commercial Bank', abbreviation: 'SLCB',
    tagline: 'Banking for every Sierra Leonean.',
  },
  rokel: {
    primary: '#DAA520', primaryLight: '#FFF8E1', primaryDark: '#003580',
    accent: '#003580', fontFamily: 'Inter',
    bankName: 'Rokel Commercial Bank', abbreviation: 'RCB',
    tagline: 'Your trusted banking partner.',
  },
  vista: {
    primary: '#C8102E', primaryLight: '#FDE8EB', primaryDark: '#8B0000',
    accent: '#FFFFFF', fontFamily: 'Inter',
    bankName: 'Vista Bank Sierra Leone', abbreviation: 'VSB',
    tagline: 'A clearer financial future.',
  },
  gtbank: {
    primary: '#F68B1F', primaryLight: '#FEF4E6', primaryDark: '#5A3200',
    accent: '#FFFFFF', fontFamily: 'Inter',
    bankName: 'GTBank Sierra Leone', abbreviation: 'GTB',
    tagline: "737. It's a number that works.",
  },
  ecobank: {
    primary: '#009A44', primaryLight: '#E0F5EB', primaryDark: '#003318',
    accent: '#0065BD', fontFamily: 'Inter',
    bankName: 'Ecobank Ghana', abbreviation: 'ECO',
    tagline: 'Pan African. Digital first.',
  },
  access: {
    primary: '#E87722', primaryLight: '#FEF0E4', primaryDark: '#2A1000',
    accent: '#003366', fontFamily: 'Inter',
    bankName: 'Access Bank Liberia', abbreviation: 'ACC',
    tagline: 'More than banking.',
  },
  brac: {
    primary: '#E41E26', primaryLight: '#FDEAEA', primaryDark: '#1A0002',
    accent: '#F47920', fontFamily: 'Inter',
    bankName: 'BRAC Sierra Leone', abbreviation: 'BRC',
    tagline: 'Building self-reliance.',
  },
  ifc: {
    primary: '#003F6B', primaryLight: '#E0EBF4', primaryDark: '#00152A',
    accent: '#F5A623', fontFamily: 'Georgia',
    bankName: 'IFC / World Bank', abbreviation: 'IFC',
    tagline: 'Creating opportunity.',
  },
  innosl: {
    primary: '#5B1FA8', primaryLight: '#EDE9FE', primaryDark: '#3B1270',
    accent: '#0EA5E9', fontFamily: 'Inter',
    bankName: 'BizReady Platform', abbreviation: 'BIZ',
    tagline: 'Business readiness. Loan confidence.',
  },
}

// ── SUBSCRIPTION PLANS ───────────────────────────────────
export type PlanTier = 'starter' | 'growth' | 'enterprise' | 'owner'

export interface Plan {
  tier: PlanTier
  name: string
  monthlyPrice: number
  submissionsPerMonth: number | 'unlimited'
  features: string[]
  stripePriceId?: string
}

export const PLANS: Record<PlanTier, Plan> = {
  starter: {
    tier: 'starter', name: 'Starter', monthlyPrice: 299,
    submissionsPerMonth: 50,
    features: ['50 diagnostics/month', 'Email results', 'Basic dashboard', 'Standard scoring'],
  },
  growth: {
    tier: 'growth', name: 'Growth', monthlyPrice: 899,
    submissionsPerMonth: 'unlimited',
    features: ['Unlimited diagnostics', 'White-label branding', 'Full analytics', 'TA programme tracker', 'Bank reports PDF', 'Priority support'],
  },
  enterprise: {
    tier: 'enterprise', name: 'Enterprise', monthlyPrice: 2500,
    submissionsPerMonth: 'unlimited',
    features: ['Everything in Growth', 'Multi-country deployment', 'Custom scoring weights', 'API access', 'Dedicated success manager', 'SLA guarantee'],
  },
  owner: {
    tier: 'owner', name: 'Platform Owner', monthlyPrice: 0,
    submissionsPerMonth: 'unlimited',
    features: ['Full platform access', 'All tenants', 'Question bank CMS', 'Revenue dashboard'],
  },
}

// ── TENANT (BANK) ─────────────────────────────────────────
export interface Tenant {
  _id: string
  slug: string          // e.g. 'uba-sl' — used in subdomain
  name: string
  theme: BankTheme
  plan: PlanTier
  clerkOrgId: string    // Clerk organisation ID
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  country: string
  region: string
  contactEmail: string
  submissionsThisMonth: number
  totalSubmissions: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// ── USER ROLES ────────────────────────────────────────────
export type UserRole = 'platform_admin' | 'bank_admin' | 'bank_staff' | 'sme'

export interface User {
  _id: string
  clerkId: string
  email: string
  name: string
  role: UserRole
  tenantId?: string     // null for platform_admin
  businessId?: string   // only for SME role
  createdAt: Date
}

// ── QUESTION BANK ─────────────────────────────────────────
export type QuestionType = 'mcq' | 'scale' | 'yesno' | 'text'
export type CapacityLevel = 'strategic' | 'operational' | 'support' | 'info' | 'final'

export interface AnswerOption {
  text: string
  score: number        // 0–10
}

export interface Question {
  _id: string
  sectionId: string
  text: string
  hint?: string
  type: QuestionType
  options: AnswerOption[]
  order: number
  isRequired: boolean
  isActive: boolean
}

export interface DiagnosticSection {
  _id: string
  name: string
  description: string
  capacityLevel: CapacityLevel
  weight: number        // e.g. 0.30 for strategic
  maxPoints: number     // validation ceiling
  order: number
  isActive: boolean
  questions: Question[]
}

// ── DIAGNOSTIC SUBMISSION ─────────────────────────────────
export interface DiagnosticResponse {
  questionId: string
  questionText: string
  selectedOption: string
  score: number
}

export interface CapacityScore {
  level: CapacityLevel
  rawScore: number
  maxScore: number
  percentage: number
  weight: number
  weightedContribution: number
}

export interface LendabilityResult {
  lendabilityIndex: number   // 0–100
  classification: 'investment_ready' | 'conditionally_lendable' | 'high_risk'
  strategic: CapacityScore
  operational: CapacityScore
  support: CapacityScore
  bottleneck: CapacityLevel
  projectedIndexAfterTA: number
  taRecommendations: TARecommendation[]
}

export interface TARecommendation {
  area: string
  capacityLevel: CapacityLevel
  currentScore: number
  targetScore: number
  recommendation: string
  tools: string[]
  timeframeWeeks: number
  priority: 'critical' | 'high' | 'medium' | 'low'
}

export interface Diagnostic {
  _id: string
  tenantId: string
  businessId: string
  userId: string
  period: string           // e.g. 'Q2-2025'
  responses: DiagnosticResponse[]
  result: LendabilityResult
  status: 'draft' | 'submitted' | 'scored' | 'reported'
  emailSent: boolean
  reportGenerated: boolean
  submittedAt?: Date
  scoredAt?: Date
  createdAt: Date
  updatedAt: Date
}

// ── SME BUSINESS PROFILE ──────────────────────────────────
export interface Business {
  _id: string
  tenantId: string
  userId: string       // Clerk user ID of owner
  name: string
  ceoName: string
  email: string
  phone: string
  sector: string
  yearsOperating: string
  employeeCount: string
  annualRevenue: string
  loanPurpose: string
  location: string
  country: string
  diagnostics: string[]  // array of diagnostic IDs
  latestScore?: number
  latestClassification?: string
  taStatus: 'none' | 'active' | 'completed'
  bankRelationshipManager?: string
  createdAt: Date
  updatedAt: Date
}

// ── TA PROGRAMME ──────────────────────────────────────────
export type TAProgrammeStatus = 'upcoming' | 'active' | 'completed' | 'paused'

export interface TAProgramme {
  _id: string
  tenantId: string
  businessId: string
  diagnosticId: string
  area: string
  capacityLevel: CapacityLevel
  recommendation: string
  tools: string[]
  timeframeWeeks: number
  startDate?: Date
  completedDate?: Date
  progressPercent: number
  status: TAProgrammeStatus
  notes?: string
  assignedBy: string
  createdAt: Date
}

// ── API RESPONSE WRAPPERS ─────────────────────────────────
export interface ApiSuccess<T> {
  success: true
  data: T
  message?: string
}

export interface ApiError {
  success: false
  error: string
  code?: string
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

// ── DASHBOARD STATS ───────────────────────────────────────
export interface TenantStats {
  totalSubmissions: number
  submissionsThisMonth: number
  averageIndex: number
  investmentReady: number
  conditionallyLendable: number
  highRisk: number
  activeTAProgrammes: number
  completedTAProgrammes: number
  conversionRate: number     // diagnostics → loans
}

export interface PlatformStats {
  totalTenants: number
  activeTenants: number
  totalDiagnostics: number
  platformMRR: number
  platformARR: number
  averageIndexAcrossPlatform: number
}
