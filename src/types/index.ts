// ─────────────────────────────────────────────────────────
//  BizReady Platform - Core TypeScript Types
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
  zenith: {
    primary: '#841D4D', primaryLight: '#F7EAF1', primaryDark: '#3D0020',
    accent: '#FFD700', fontFamily: 'Inter',
    bankName: 'Zenith Bank SL', abbreviation: 'ZBSL',
    tagline: 'In your best interest.',
  },
  afdb: {
    primary: '#007DC3', primaryLight: '#E0F2FB', primaryDark: '#003558',
    accent: '#F5A623', fontFamily: 'Inter',
    bankName: 'African Development Bank', abbreviation: 'AfDB',
    tagline: 'Building a better Africa.',
  },
  innosl: {
    primary: '#5B1FA8', primaryLight: '#EDE9FE', primaryDark: '#3B1270',
    accent: '#0EA5E9', fontFamily: 'Inter',
    bankName: 'BizReady Platform', abbreviation: 'BIZ',
    tagline: 'Business readiness. Loan confidence.',
  },
}

// ── PLAN TIERS - SUBSCRIPTION LEVELS ─────────────────────────
export type PlanTier = 'starter' | 'growth' | 'enterprise' | 'owner'

export interface PlanDetails {
  name: string
  price: number
  submissionsPerMonth: number | 'unlimited'
  features: string[]
}

export const PLANS: Record<PlanTier, PlanDetails> = {
  starter: {
    name: 'Starter',
    price: 299,
    submissionsPerMonth: 50,
    features: [
      '50 diagnostics per month',
      'Automated email results',
      'Basic bank dashboard',
      'Standard scoring engine',
      'Email support',
    ],
  },
  growth: {
    name: 'Growth',
    price: 899,
    submissionsPerMonth: 'unlimited',
    features: [
      'Unlimited diagnostics',
      'White-label branding & custom domain',
      'Full analytics dashboard',
      'TA programme tracker',
      'PDF bank reports',
      'CSV/Excel question bank import',
      'Priority support',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    price: 2500,
    submissionsPerMonth: 'unlimited',
    features: [
      'Everything in Growth',
      'Multi-country deployment',
      'Custom scoring weights per country',
      'Full API access',
      'Dedicated success manager',
      'SLA guarantee',
      'White-glove onboarding',
    ],
  },
  owner: {
    name: 'Platform Owner',
    price: 0,
    submissionsPerMonth: 'unlimited',
    features: ['Full platform access', 'All tenants', 'Question bank CMS', 'Revenue dashboard'],
  },
}

// ── TENANT (BANK) ─────────────────────────────────────────
export interface ScoringWeights {
  strategic: number
  process:   number
  support:   number
}

export interface Tenant {
  _id: string
  slug: string
  name: string
  theme: BankTheme
  plan: PlanTier
  clerkOrgId: string
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  country: string
  region: string
  contactEmail: string
  submissionsThisMonth: number
  totalSubmissions: number
  isActive: boolean
  scoringWeights?: ScoringWeights
  customDomain?: string
  successManagerId?: string
  successManagerName?: string
  successManagerEmail?: string
  onboardingSteps?: string[]
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
  tenantId?: string
  businessId?: string
  createdAt: Date
}

// ── QUESTION BANK ─────────────────────────────────────────
export type QuestionType = 'mcq' | 'scale' | 'yesno' | 'text'
export type CapacityLevel = 'strategic' | 'process' | 'support' | 'info' | 'final'
/** @deprecated use CapacityLevel - 'operational' is now 'process' */
export type LegacyCapacityLevel = CapacityLevel | 'operational'

export interface AnswerOption {
  text: string
  score: number  // 0–10
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
  // Extended fields for 12-area system
  areaId?: string      // capacity area key e.g. 'strategicManagement'
  parameterId?: string // parameter key e.g. 'missionVision'
}

export interface DiagnosticSection {
  _id: string
  name: string
  description: string
  capacityLevel: CapacityLevel
  weight: number
  maxPoints: number
  order: number
  isActive: boolean
  questions: Question[]
  // Extended fields for 12-area system
  areaId?: string      // capacity area key
  areaNumber?: number  // 1–12
}

// ── 12-AREA CAPACITY STRUCTURE ────────────────────────────
export type CapacityAreaKey =
  | 'strategicManagement' | 'managementLeadership' | 'businessEnvironment'
  | 'productionOperations' | 'marketingSales' | 'environmentalManagement'
  | 'organizationalStructure' | 'finance' | 'humanResources'
  | 'informationManagement' | 'qualityManagement' | 'technologicalInnovation'

export type GapClassification = 'high_priority_gap' | 'low_priority_gap' | 'ideal_performance'

export interface CapacityAreaDefinition {
  key: CapacityAreaKey
  name: string
  number: number  // 1–12
  level: 'strategic' | 'process' | 'support'
  maxPoints: number
  parameters: ParameterDefinition[]
}

export interface ParameterDefinition {
  id: string
  name: string
  aspects: string  // comma-separated list of aspects being assessed
}

// All 12 capacity areas with their parameters
export const CAPACITY_AREAS: CapacityAreaDefinition[] = [
  // ── STRATEGIC ───────────────────────────────────────────
  {
    key: 'strategicManagement', name: 'Strategic Management', number: 1,
    level: 'strategic', maxPoints: 30,
    parameters: [
      { id: 'missionVision',        name: 'Mission & Vision',              aspects: 'Company Mission, Level of Mission Socialization, Evaluation of Strategic Goal, Business Model' },
      { id: 'companyHistory',       name: 'Company History',               aspects: 'Reason for Company Existence, Historical Growth Description, Influences in development' },
      { id: 'strategicPlanning',    name: 'Strategic Planning Process',    aspects: 'Specification of Strategic Objectives, Consistency between Operations and Strategic Objectives, Consistency between strategic objectives and company structure' },
    ],
  },
  {
    key: 'managementLeadership', name: 'Management & Leadership', number: 2,
    level: 'strategic', maxPoints: 30,
    parameters: [
      { id: 'leadershipStyle',      name: 'Leadership Style',              aspects: 'Management Leadership Style, Criteria for assigning responsibilities' },
      { id: 'autonomy',             name: 'Autonomy',                      aspects: 'Level of Decision-making autonomy for owner, Level for executives' },
      { id: 'managementTools',      name: 'Management Tools',              aspects: 'Instruments utilised, Information mechanism for decisions' },
    ],
  },
  {
    key: 'businessEnvironment', name: 'Business Environment', number: 3,
    level: 'strategic', maxPoints: 30,
    parameters: [
      { id: 'regulationInstitution',name: 'Regulation and Institutionalism', aspects: 'Knowledge of Regulations, Public/private institutions, Development Instruments' },
      { id: 'sectorUnderstanding',  name: 'Understanding of the Sector',   aspects: 'Macroeconomic Variables, Evaluation of economic sector, Practices to learn about environment' },
      { id: 'alliances',            name: 'Alliances',                     aspects: 'Evaluation of strategic relationships, New Business Opportunities' },
    ],
  },
  // ── PROCESS ─────────────────────────────────────────────
  {
    key: 'productionOperations', name: 'Production and Operations', number: 4,
    level: 'process', maxPoints: 60,
    parameters: [
      { id: 'suppliers',            name: 'Suppliers',                     aspects: 'Criteria for Selecting providers, Procurement Plan, Provider Compliance, Reception of Materials' },
      { id: 'inventoryHandling',    name: 'Inventory Handling',            aspects: 'Raw materials handling, Inventory systematization, Warehousing, Control of Inventory' },
      { id: 'productPlanning',      name: 'Product Planning',              aspects: 'Product Demand Forecast, Master Plan for Production, Material resources planning, Proficiency in product/service development' },
      { id: 'plantLayout',          name: 'Plant Layout',                  aspects: 'Optimum machines layout, Physical space for growth, Plant layout diagram' },
      { id: 'technologicalLevel',   name: 'Technological Level',           aspects: 'Age and condition of machinery, Procurement planning for equipment, Manuals and historical records' },
      { id: 'machineryMaintenance', name: 'Machinery Maintenance',         aspects: 'Maintenance plan, Qualified personnel, Coordination between production and maintenance, Frequency of failures' },
    ],
  },
  {
    key: 'marketingSales', name: 'Marketing and Sales', number: 5,
    level: 'process', maxPoints: 80,
    parameters: [
      { id: 'clientRelationship',   name: 'Client Relationship',           aspects: 'Client Service, Client Relationship, Client Satisfaction' },
      { id: 'strategicSegmentation',name: 'Strategic Segmentation',        aspects: 'Client Segmentation, Definition of Target Markets, Positioning' },
      { id: 'productsServices',     name: 'Products/Services',             aspects: 'Coordination between production and marketing, Product Development, Contributions from sales team' },
      { id: 'price',                name: 'Price',                         aspects: 'Price based on cost structure, Competitive price studies, Product features and price setting, Business environment and trends' },
      { id: 'salesManagement',      name: 'Sales Management',              aspects: 'Importance of Sales force, Sales Management System, Control and Tracking, Sales force training, Support Material' },
      { id: 'communications',       name: 'Communications',                aspects: 'Promotion Policy, Communication Plan, Consistency in communications, Budget' },
      { id: 'distribution',         name: 'Distribution',                  aspects: 'Distribution Channel, Contracts with Distributors, Product Training' },
      { id: 'exports',              name: 'Exports',                       aspects: 'Export Plan, Commercial information, Export Strategy, Distribution' },
    ],
  },
  {
    key: 'environmentalManagement', name: 'Environmental Management', number: 6,
    level: 'process', maxPoints: 30,
    parameters: [
      { id: 'envRegulations',       name: 'Environmental Regulations',     aspects: 'Environmental policy, Register of parameters, Community complaints, Health citation' },
      { id: 'wasteManagement',      name: 'Waste Management',              aspects: 'Characteristics of wastes/emissions, Waste origin and composition, Waste Treatment, Pollution prevention' },
      { id: 'occupationalRisk',     name: 'Occupational Risk and Health',  aspects: 'Experts in Risk prevention, Risk prevention training, Safe system, Production ventilation, Personnel protection' },
    ],
  },
  // ── SUPPORT ─────────────────────────────────────────────
  {
    key: 'organizationalStructure', name: 'Organizational Structure', number: 7,
    level: 'support', maxPoints: 20,
    parameters: [
      { id: 'divisionOfLabor',      name: 'Division of Labor',             aspects: 'Description of internal organisation, Degree of formalisation of functions, Hierarchy' },
      { id: 'decisionMakingPower',  name: 'Decision Making Power',         aspects: 'Description of decision-making process, Participation of personnel' },
    ],
  },
  {
    key: 'finance', name: 'Finance', number: 8,
    level: 'support', maxPoints: 40,
    parameters: [
      { id: 'legalTaxLegislation',  name: 'Legal and Tax Legislation',     aspects: 'Legal records, Tax clarity, Tax planning and control' },
      { id: 'accountingRecords',    name: 'Accounting Records',            aspects: 'Accounting Records, Records of sales tax, Person in charge of Bookkeeping, Availability and timeliness of information, Cash flows' },
      { id: 'costs',                name: 'Costs',                         aspects: 'Costs registers, Use of the registers, Costs analysis reports, Costs Control' },
      { id: 'financialAdmin',       name: 'Financial Administration',      aspects: 'Budgets and income statements, Investment Policy, Analysis of Financial figures' },
    ],
  },
  {
    key: 'humanResources', name: 'Human Resources', number: 9,
    level: 'support', maxPoints: 40,
    parameters: [
      { id: 'staffPerformance',     name: 'Staff Performance',             aspects: 'Technical competence of personnel, Utilisation of technical competence' },
      { id: 'personnelPolicy',      name: 'Personnel Policy',              aspects: 'Systems of personnel recruitment/selection/orientation, Personnel Promotion policy, Training Policy, Employment policy' },
      { id: 'personnelBenefits',    name: 'Personnel Benefits and Incentives', aspects: 'Incentive Policy, Level of personnel motivation, Evaluation System, Compensation and benefits system' },
      { id: 'corporateClimate',     name: 'Corporate Climate',             aspects: 'Sense of belonging, Employee satisfaction with the company, Employee turnover' },
    ],
  },
  {
    key: 'informationManagement', name: 'Information Management', number: 10,
    level: 'support', maxPoints: 20,
    parameters: [
      { id: 'information',          name: 'Information',                   aspects: 'Management of internal/external information sources, Information processing, Information use, Effectiveness of information coordination' },
      { id: 'communication',        name: 'Communication',                 aspects: 'Communication speed and fluency, Communication coverage, Efficiency in coordination' },
    ],
  },
  {
    key: 'qualityManagement', name: 'Quality Management', number: 11,
    level: 'support', maxPoints: 30,
    parameters: [
      { id: 'qualityControl',       name: 'Quality Control',               aspects: 'Quality control policy, Quality control Supervisor, Rejected products, Rejection procedures' },
      { id: 'procedures',           name: 'Procedures',                    aspects: 'Quality procedures, Measurement Instruments, Systematic Quality Checks, Systematic operations of Quality Assurance' },
      { id: 'productQuality',       name: 'Product Quality',               aspects: 'Product quality checks, Product records, Product guarantee' },
    ],
  },
  {
    key: 'technologicalInnovation', name: 'Technological Innovation', number: 12,
    level: 'support', maxPoints: 50,
    parameters: [
      { id: 'technologicalStrategy',name: 'Technological Strategy',        aspects: 'Innovation and technology is part of strategic plan, Strategic Product Development' },
      { id: 'innovationCulture',    name: 'Corporate Culture for Innovation', aspects: 'Contact with clients and research for product improvement, Technical Training, Process Improvement, Worker participation in quality improvement, Recognition for innovation' },
      { id: 'systemInfrastructure', name: 'System and Infrastructure',     aspects: 'Development Unit, Contact with technological institutions, Testing laboratories and quality control, Joint Technological ventures' },
      { id: 'innovationExecution',  name: 'Execution of Innovation Projects', aspects: 'Innovation projects budgets, Credits and subsidies, Innovation project portfolio, Administration of innovation projects' },
      { id: 'informationTech',      name: 'Information Technologies',      aspects: 'Incorporation of information technologies, Benefits and opportunities, Investment information system improvement' },
    ],
  },
]

// Max points per level
export const LEVEL_MAX: Record<'strategic' | 'process' | 'support', number> = {
  strategic: 90,   // 3 areas �- 30 pts
  process:   170,  // 60 + 80 + 30
  support:   200,  // 20 + 40 + 40 + 20 + 30 + 50
}

export const LEVEL_WEIGHTS: Record<'strategic' | 'process' | 'support', number> = {
  strategic: 0.30,
  process:   0.45,
  support:   0.25,
}

// ── GAP CLASSIFICATION ────────────────────────────────────
export function classifyGap(percentage: number): GapClassification {
  if (percentage >= 80) return 'ideal_performance'
  if (percentage >= 50) return 'low_priority_gap'
  return 'high_priority_gap'
}

export function gapLabel(gap: GapClassification): string {
  return {
    high_priority_gap: 'High Priority Gap',
    low_priority_gap:  'Low Priority Gap',
    ideal_performance: 'Ideal Performance',
  }[gap]
}

export function gapColor(gap: GapClassification): string {
  return {
    high_priority_gap: '#A32D2D',
    low_priority_gap:  '#BA7517',
    ideal_performance: '#0F6E56',
  }[gap]
}

export function gapBg(gap: GapClassification): string {
  return {
    high_priority_gap: '#FCEBEB',
    low_priority_gap:  '#FAEEDA',
    ideal_performance: '#E1F5EE',
  }[gap]
}

// ── DIAGNOSTIC SUBMISSION ─────────────────────────────────
export interface DiagnosticResponse {
  questionId:     string
  questionText:   string
  selectedOption: string
  score:          number  // 0–10 for parameter questions
  areaId?:        string  // capacity area key (for 12-area scoring)
  parameterId?:   string  // parameter id within area
}

export interface ParameterScore {
  parameterId:         string
  parameterName:       string
  score:               number  // 0–10
  gapClassification:   GapClassification
}

export interface AreaScore {
  areaKey:             CapacityAreaKey
  areaName:            string
  areaNumber:          number
  level:               'strategic' | 'process' | 'support'
  rawScore:            number
  maxScore:            number
  percentage:          number
  gapClassification:   GapClassification
  parameterScores:     ParameterScore[]
}

export interface CapacityScore {
  level:                string
  rawScore:             number
  maxScore:             number
  percentage:           number
  weight:               number
  weightedContribution: number
  gapClassification?:   GapClassification
}

export interface LendabilityResult {
  lendabilityIndex:       number   // 0–100
  classification:         'investment_ready' | 'conditionally_lendable' | 'high_risk'
  // Level scores
  strategic:              CapacityScore
  process:                CapacityScore
  support:                CapacityScore
  /** @deprecated Use 'process'. Kept for backward compat. */
  operational?:           CapacityScore
  // 12-area breakdown
  areaScores:             AreaScore[]
  bottleneck:             string
  projectedIndexAfterTA:  number
  taRecommendations:      TARecommendation[]
}

export interface TARecommendation {
  area:            string
  parameterId?:    string
  capacityLevel:   string
  currentScore:    number
  targetScore:     number
  recommendation:  string
  tools:           string[]
  timeframeWeeks:  number
  priority:        'critical' | 'high' | 'medium' | 'low'
}

export interface Diagnostic {
  _id: string
  tenantId: string
  businessId: string
  userId: string
  period: string
  responses: DiagnosticResponse[]
  result: LendabilityResult
  taAnalysis?: TADiagnosticAnalysis
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
  userId: string
  name: string
  ceoName: string
  email: string
  phone: string
  sector: string
  yearsOperating: string
  employeeCount: string
  femaleEmployeeCount?: string
  annualRevenue: string
  loanPurpose: string
  location: string
  district?: string
  country: string
  problemSolving?: string
  proposedSolution?: string
  foundingDate?: string
  registrationStatus?: string
  diagnostics: string[]
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
  parameterId?: string
  capacityLevel: string
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
export interface ApiSuccess<T> { success: true; data: T; message?: string }
export interface ApiError     { success: false; error: string; code?: string }
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
  conversionRate: number
}

export interface PlatformStats {
  totalTenants: number
  activeTenants: number
  totalDiagnostics: number
  platformMRR: number
  platformARR: number
  averageIndexAcrossPlatform: number
}

// ── FUNNEL STAGE ──────────────────────────────────────────
export interface FunnelStage {
  label: string
  count: number
  color: string
}

// ── ANALYTICS DASHBOARD ───────────────────────────────────
export interface AnalyticsParameter {
  id: string
  name: string
  score: number | null
  max: number
  pct: number | null
  gap: GapClassification | null
  aspects: string[]
}

export type AnalyticsLevelKey = 'strategic' | 'process' | 'support'
export type AnalyticsTabKey = 'overview' | AnalyticsLevelKey

export interface AnalyticsCommentMap {
  strategic: string
  process: string
  support: string
}

export interface AnalyticsArea {
  key: CapacityAreaKey | string
  name: string
  level: AnalyticsLevelKey
  score: number
  max: number
  pct: number
  gap: GapClassification
  parameters: AnalyticsParameter[]
}

export interface AnalyticsLevelData {
  total: number
  max: number
  pct: number
  gap: GapClassification
  areas: AnalyticsArea[]
}

export interface AnalyticsOverviewArea {
  key: CapacityAreaKey | string
  name: string
  level: AnalyticsLevelKey
  score: number
  max: number
  pct: number
  gap: GapClassification
}

export interface AnalyticsOverview {
  overallIndex: number
  classification: LendabilityResult['classification']
  strategicTotal: number
  strategicMax: number
  strategicPct: number
  processTotal: number
  processMax: number
  processPct: number
  supportTotal: number
  supportMax: number
  supportPct: number
  areas: AnalyticsOverviewArea[]
}

export interface TADiagnosticAnalysis {
  overview: AnalyticsOverview
  strategic: AnalyticsLevelData | null
  process: AnalyticsLevelData | null
  support: AnalyticsLevelData | null
}

export interface AnalyticsDiagnostic extends TADiagnosticAnalysis {
  id: string
  date: string
  period: string
  assessorName?: string | null
  hasFullAnalysis: boolean
  assessorComment: AnalyticsCommentMap
}

export interface AnalyticsBusinessSummary {
  id: string
  name: string
  sector: string
  ceoName: string
}

export interface BankAnalyticsPayload {
  business: AnalyticsBusinessSummary
  diagnostic: AnalyticsDiagnostic | null
}

export function classifyAnalyticsGap(percentage: number): GapClassification {
  if (percentage > 70) return 'ideal_performance'
  if (percentage > 40) return 'low_priority_gap'
  return 'high_priority_gap'
}
