export const dynamic = 'force-dynamic'

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Business, Diagnostic, Tenant, User } from '@/models'
import { canAccessFullAnalytics } from '@/lib/plan-access'
import {
  CAPACITY_AREAS,
  LEVEL_MAX,
  classifyAnalyticsGap,
  type AnalyticsBusinessSummary,
  type AnalyticsCommentMap,
  type AnalyticsDiagnostic,
  type AnalyticsLevelData,
  type AnalyticsLevelKey,
  type AnalyticsOverview,
  type AnalyticsParameter,
  type BankAnalyticsPayload,
  type CapacityAreaKey,
  type TADiagnosticAnalysis,
} from '@/types'

type AnalyticsCopy = Record<
  CapacityAreaKey,
  {
    name: string
    parameters: Record<string, { name: string; aspects: string[] }>
  }
>

const ANALYTICS_COPY: AnalyticsCopy = {
  strategicManagement: {
    name: 'Strategic Management Area',
    parameters: {
      missionVision: {
        name: 'Mission & Vision',
        aspects: [
          'Company Mission',
          'Level of Mission Socialization',
          'Evaluation of Strategic Goal',
          'Business Model',
        ],
      },
      companyHistory: {
        name: 'Company History',
        aspects: [
          'Reason for Company Existence',
          'Description of the Historical Growth of the Company',
          'Influences in company development',
        ],
      },
      strategicPlanning: {
        name: 'Strategic Planning Process',
        aspects: [
          'Specification of Strategic Objectives',
          'Consistency between Operations and Strategic Objectives',
          'Consistency between strategic objectives and company structure',
        ],
      },
    },
  },
  managementLeadership: {
    name: 'Management & Leadership Area',
    parameters: {
      leadershipStyle: {
        name: 'Leadership Style',
        aspects: [
          'Management Leadership Style',
          'Criteria for assigning responsibilities',
        ],
      },
      autonomy: {
        name: 'Autonomy',
        aspects: [
          'Level of Decision-making autonomy for the owner',
          'Level of decision-making autonomy for executives',
        ],
      },
      managementTools: {
        name: 'Management Tools',
        aspects: [
          'Instruments utilized',
          'Information mechanism for decisions made',
        ],
      },
    },
  },
  businessEnvironment: {
    name: 'Business Environment Area',
    parameters: {
      regulationInstitution: {
        name: 'Regulation and Institutionalism',
        aspects: [
          'Knowledge of Regulations',
          'Public and private institutions',
          'Development Instruments',
        ],
      },
      sectorUnderstanding: {
        name: 'Understanding of the Sector',
        aspects: [
          'Macroeconomic Variables',
          'Evaluation of the economic sector',
          'Practices used to learn about the environment',
        ],
      },
      alliances: {
        name: 'Alliances',
        aspects: [
          'Evaluation of strategic relationships',
          'New Business Opportunities',
        ],
      },
    },
  },
  productionOperations: {
    name: 'Production and Operations Area',
    parameters: {
      suppliers: {
        name: 'Suppliers',
        aspects: [
          'Criteria for Selecting providers',
          'Procurement Plan',
          'Provider Compliance',
          'Reception of Materials',
        ],
      },
      inventoryHandling: {
        name: 'Inventory Handling',
        aspects: [
          'Raw materials handling',
          'Inventory systematization',
          'Warehousing',
          'Control of Inventory',
        ],
      },
      productPlanning: {
        name: 'Product Planning',
        aspects: [
          'Product Demand Forecast',
          'Master Plan for Production',
          'Material resources planning and process control',
          'Proficiency in product/service development',
        ],
      },
      plantLayout: {
        name: 'Plant Layout',
        aspects: [
          'Optimum machines layout in plant',
          'Physical space for growth',
          'Plant layout diagram',
        ],
      },
      technologicalLevel: {
        name: 'Technological Level',
        aspects: [
          'Age and condition of machinery and equipment',
          'Procurement planning for equipment and machinery',
          'Manuals and historical record for machinery and equipment',
        ],
      },
      machineryMaintenance: {
        name: 'Machinery Maintenance',
        aspects: [
          'Maintenance plan',
          'Qualified personnel to perform the maintenance',
          'Coordination between production and maintenance',
          'Frequency of failures and shutdowns',
        ],
      },
    },
  },
  marketingSales: {
    name: 'Marketing and Sales Area',
    parameters: {
      clientRelationship: {
        name: 'Client Relationship',
        aspects: ['Client Service', 'Client Relationship', 'Client Satisfaction'],
      },
      strategicSegmentation: {
        name: 'Strategic Segmentation, target market and positioning',
        aspects: [
          'Client Segmentation',
          'Definition of Target Markets',
          'Positioning',
        ],
      },
      productsServices: {
        name: 'Products / Services',
        aspects: [
          'Coordination between production and marketing',
          'Product Development',
          'Contributions from sales team to new products',
        ],
      },
      price: {
        name: 'Price',
        aspects: [
          'Price based on cost structure',
          'Competitive price studies',
          'Product features and price setting',
          'Business environment and trends',
        ],
      },
      salesManagement: {
        name: 'Sales Management',
        aspects: [
          'Importance of the Sales force',
          'Sales Management System',
          'Control and Tracking of Management',
          'Sales force training',
          'Support Material',
        ],
      },
      communications: {
        name: 'Communications',
        aspects: [
          'Promotion Policy',
          'Communication Plan',
          'Consistency in communications',
          'Budget',
        ],
      },
      distribution: {
        name: 'Distribution',
        aspects: [
          'Distribution Channel',
          'Contracts with Distributors',
          'Product Training',
        ],
      },
      exports: {
        name: 'Exports',
        aspects: [
          'Export Plan',
          'Commercial information',
          'Export Strategy',
          'Distribution',
        ],
      },
    },
  },
  environmentalManagement: {
    name: 'Environmental Management Area',
    parameters: {
      envRegulations: {
        name: 'Environmental Regulations',
        aspects: [
          'Environmental policy',
          'Register of parameters for environmental management',
          'Community complaints',
          'Health citation',
        ],
      },
      wasteManagement: {
        name: 'Waste Management',
        aspects: [
          'Characteristics of wastes or emissions',
          'Waste origin and composition',
          'Waste Treatment',
          'Pollution prevention',
        ],
      },
      occupationalRisk: {
        name: 'Occupational Risk and Health',
        aspects: [
          'Experts in Risk prevention',
          'Risk prevention training',
          'Safe system',
          'Production ventilation',
          'Personnel protection',
        ],
      },
    },
  },
  organizationalStructure: {
    name: 'Organizational Structure Area',
    parameters: {
      divisionOfLabor: {
        name: 'Division of Labor',
        aspects: [
          "Description of the company's internal organization",
          'Degree of formalization of functions',
          'Hierarchy',
        ],
      },
      decisionMakingPower: {
        name: 'Decision Making Power',
        aspects: [
          'Description of the decision-making process',
          'Participation of personnel in the decision-making process',
        ],
      },
    },
  },
  finance: {
    name: 'Finance Area',
    parameters: {
      legalTaxLegislation: {
        name: 'Legal and Tax Legislation',
        aspects: ['Legal records', 'Tax clarity', 'Tax planning and control'],
      },
      accountingRecords: {
        name: 'Accounting Records',
        aspects: [
          'Accounting Records',
          'Records of sales tax',
          'Person in charge of Bookkeeping',
          'Availability and timeliness of information',
          'Cash flows',
        ],
      },
      costs: {
        name: 'Costs',
        aspects: [
          'Costs registers',
          'Use of the registers',
          'Costs analysis reports',
          'Costs Control',
        ],
      },
      financialAdmin: {
        name: 'Financial Administration',
        aspects: [
          'Budgets and income statements',
          'Investment Policy',
          'Analysis of Financial figures',
        ],
      },
    },
  },
  humanResources: {
    name: 'Human Resources Area',
    parameters: {
      staffPerformance: {
        name: 'Staff Performance',
        aspects: [
          'Technical competence of personnel',
          'Utilization of technical competence',
        ],
      },
      personnelPolicy: {
        name: 'Personnel Policy',
        aspects: [
          'Systems of personnel recruitment/selection/orientation',
          'Personnel Promotion policy',
          'Training Policy',
          'Employment policy',
        ],
      },
      personnelBenefits: {
        name: 'Personnel Benefits and Incentives',
        aspects: [
          'Incentive Policy',
          'Level of personnel motivation',
          'Evaluation System',
          'Compensation and benefits system',
        ],
      },
      corporateClimate: {
        name: 'Corporate Climate and Personnel Motivation',
        aspects: [
          'Sense of belonging',
          'Employee satisfaction with the company',
          'Employee turnover',
        ],
      },
    },
  },
  informationManagement: {
    name: 'Information Management Area',
    parameters: {
      information: {
        name: 'Information',
        aspects: [
          'Management of internal and external information sources',
          'Information processing',
          'Information use',
          'Effectiveness of information coordination',
        ],
      },
      communication: {
        name: 'Communication',
        aspects: [
          'Communication speed and fluency',
          'Communication coverage',
          'Efficiency in coordination of communication',
        ],
      },
    },
  },
  qualityManagement: {
    name: 'Quality Management Area',
    parameters: {
      qualityControl: {
        name: 'Quality Control',
        aspects: [
          'Quality control policy',
          'Quality control Supervisor',
          'Rejected products',
          'Rejection procedures',
        ],
      },
      procedures: {
        name: 'Procedures',
        aspects: [
          'Quality procedures',
          'Measurement Instruments',
          'Systematic Quality Checks',
          'Systematic operations of Quality Assurance',
        ],
      },
      productQuality: {
        name: 'Product Quality',
        aspects: ['Product quality checks', 'Product records', 'Product guarantee'],
      },
    },
  },
  technologicalInnovation: {
    name: 'Technological Innovation Area',
    parameters: {
      technologicalStrategy: {
        name: 'Technological Strategy',
        aspects: [
          'Innovation and technology is part of strategic plan',
          'Strategic Product Development',
        ],
      },
      innovationCulture: {
        name: 'Corporate Culture for Innovation',
        aspects: [
          'Contact with clients and research for product improvement necessities',
          'Technical Training',
          'Process Improvement',
          'Worker participation in quality improvement',
          'Recognition for innovation and continuous improvement',
        ],
      },
      systemInfrastructure: {
        name: 'System and Infrastructure',
        aspects: [
          'Development Unit',
          'Contact with technological institutions',
          'Testing laboratories and quality control',
          'Joint Technological ventures',
        ],
      },
      innovationExecution: {
        name: 'Execution of Innovation Projects',
        aspects: [
          'Innovation projects budgets',
          'Credits and subsidies',
          'Innovation project portfolio',
          'Administration of innovation projects execution',
        ],
      },
      informationTech: {
        name: 'Information Technologies',
        aspects: [
          'Incorporation of information technologies',
          'Benefits and opportunities',
          'Investment information system improvement',
        ],
      },
    },
  },
}

export async function GET(req: NextRequest) {
  const authResult = await requireBankUser()
  if ('error' in authResult) return authResult.error

  const { user } = authResult
  const tenantId = String(user.tenantId)
  const { searchParams } = new URL(req.url)
  const businessId = searchParams.get('businessId')
  const requestedTenantId = searchParams.get('tenantId')

  if (!businessId) {
    return NextResponse.json({ success: false, error: 'businessId is required' }, { status: 400 })
  }

  if (requestedTenantId && requestedTenantId !== tenantId) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  const tenant = await Tenant.findById(user.tenantId).lean() as any
  if (!tenant) {
    return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 })
  }

  const hasFullAnalytics = canAccessFullAnalytics(tenant.plan)

  const business = await Business.findOne({ _id: businessId, tenantId: user.tenantId }).lean() as any
  if (!business) {
    return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
  }

  const query: Record<string, unknown> = {
    tenantId: user.tenantId,
    businessId,
  }

  const from = parseStartDate(searchParams.get('from'))
  const to = parseEndDate(searchParams.get('to'))

  if (from || to) {
    query.createdAt = {}
    if (from) (query.createdAt as Record<string, Date>).$gte = from
    if (to) (query.createdAt as Record<string, Date>).$lte = to
  }

  const diagnostic = await Diagnostic.findOne(query).sort({ createdAt: -1 }).lean() as any
  const businessSummary = serializeBusiness(business)

  if (!diagnostic) {
    return NextResponse.json({
      success: true,
      data: {
        business: businessSummary,
        diagnostic: null,
      } satisfies BankAnalyticsPayload,
    })
  }

  const analysis = buildAnalysisFromDiagnostic(diagnostic) ?? normalizeStoredAnalysis(diagnostic.taAnalysis)
  if (analysis && !diagnostic.taAnalysis) {
    await Diagnostic.updateOne(
      { _id: diagnostic._id, tenantId: user.tenantId },
      { $set: { taAnalysis: analysis } },
    )
  }

  const assessorName = await resolveAssessorName(diagnostic.userId)
  const responseDiagnostic: AnalyticsDiagnostic = {
    id: String(diagnostic._id),
    date: toIsoString(diagnostic.scoredAt ?? diagnostic.submittedAt ?? diagnostic.createdAt),
    period: diagnostic.period ?? '',
    assessorName,
    hasFullAnalysis: Boolean(analysis) && hasFullAnalytics,
    assessorComment: normalizeCommentMap(diagnostic.assessorComments),
    overview: analysis?.overview ?? buildBasicOverview(diagnostic),
    strategic: hasFullAnalytics ? analysis?.strategic ?? null : null,
    process: hasFullAnalytics ? analysis?.process ?? null : null,
    support: hasFullAnalytics ? analysis?.support ?? null : null,
  }

  return NextResponse.json({
    success: true,
    data: {
      business: businessSummary,
      diagnostic: responseDiagnostic,
    } satisfies BankAnalyticsPayload,
  })
}

export async function PATCH(req: NextRequest) {
  const authResult = await requireBankUser()
  if ('error' in authResult) return authResult.error

  const body = await req.json()
  const diagnosticId = typeof body?.diagnosticId === 'string' ? body.diagnosticId : ''
  const level = body?.level as AnalyticsLevelKey | undefined
  const comment = typeof body?.comment === 'string' ? body.comment : ''

  if (!diagnosticId || !level || !['strategic', 'process', 'support'].includes(level)) {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })
  }

  const tenant = await Tenant.findById(authResult.user.tenantId).lean() as any
  if (!tenant) {
    return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 })
  }
  if (!canAccessFullAnalytics(tenant.plan)) {
    return NextResponse.json({ success: false, error: 'Upgrade to Growth to save detailed analytics comments.' }, { status: 403 })
  }

  const result = await Diagnostic.updateOne(
    { _id: diagnosticId, tenantId: authResult.user.tenantId },
    { $set: { [`assessorComments.${level}`]: comment } },
  )

  if (!result.matchedCount) {
    return NextResponse.json({ success: false, error: 'Diagnostic not found' }, { status: 404 })
  }

  return NextResponse.json({
    success: true,
    data: { diagnosticId, level, comment },
  })
}

async function requireBankUser() {
  const { userId } = await auth()
  if (!userId) {
    return {
      error: NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }),
    }
  }

  await connectDB()

  const user = await User.findOne({ clerkId: userId }).lean() as any
  if (!user || !['bank_admin', 'bank_staff'].includes(user.role)) {
    return {
      error: NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 }),
    }
  }

  return { user }
}

function normalizeCommentMap(input: any): AnalyticsCommentMap {
  return {
    strategic: typeof input?.strategic === 'string' ? input.strategic : '',
    process: typeof input?.process === 'string' ? input.process : '',
    support: typeof input?.support === 'string' ? input.support : '',
  }
}

function buildBasicOverview(diagnostic: any): AnalyticsOverview {
  const result = diagnostic?.result ?? {}
  const strategic = result?.strategic ?? {}
  const process = result?.process ?? result?.operational ?? {}
  const support = result?.support ?? {}

  return {
    overallIndex: round1(Number(result?.lendabilityIndex ?? 0)),
    classification: resolveClassification(result?.classification, result?.lendabilityIndex),
    strategicTotal: Number(strategic?.rawScore ?? 0),
    strategicMax: LEVEL_MAX.strategic,
    strategicPct: round1(Number(strategic?.percentage ?? 0)),
    processTotal: Number(process?.rawScore ?? 0),
    processMax: LEVEL_MAX.process,
    processPct: round1(Number(process?.percentage ?? 0)),
    supportTotal: Number(support?.rawScore ?? 0),
    supportMax: LEVEL_MAX.support,
    supportPct: round1(Number(support?.percentage ?? 0)),
    areas: [],
  }
}

function buildAnalysisFromDiagnostic(diagnostic: any): TADiagnosticAnalysis | null {
  const result = diagnostic?.result ?? {}
  const areaScores = Array.isArray(result?.areaScores) ? result.areaScores : []
  if (!areaScores.length) return null

  const strategic = buildLevelData('strategic', areaScores)
  const process = buildLevelData('process', areaScores)
  const support = buildLevelData('support', areaScores)

  const overviewAreas = CAPACITY_AREAS.map((area) => {
    const storedArea = findAreaScore(areaScores, area.key)
    const score = Number(storedArea?.rawScore ?? 0)
    const pct = round1(toPercentage(score, area.maxPoints))
    return {
      key: area.key,
      name: getAreaCopy(area.key).name,
      level: area.level,
      score,
      max: area.maxPoints,
      pct,
      gap: classifyAnalyticsGap(pct),
    }
  })

  return {
    overview: {
      overallIndex: round1(Number(result?.lendabilityIndex ?? 0)),
      classification: resolveClassification(result?.classification, result?.lendabilityIndex),
      strategicTotal: strategic.total,
      strategicMax: LEVEL_MAX.strategic,
      strategicPct: strategic.pct,
      processTotal: process.total,
      processMax: LEVEL_MAX.process,
      processPct: process.pct,
      supportTotal: support.total,
      supportMax: LEVEL_MAX.support,
      supportPct: support.pct,
      areas: overviewAreas,
    },
    strategic,
    process,
    support,
  }
}

function buildLevelData(level: AnalyticsLevelKey, areaScores: any[]): AnalyticsLevelData {
  const areas = CAPACITY_AREAS
    .filter((area) => area.level === level)
    .map((area) => {
      const storedArea = findAreaScore(areaScores, area.key)
      const score = Number(storedArea?.rawScore ?? 0)
      const pct = round1(toPercentage(score, area.maxPoints))
      const parameters: AnalyticsParameter[] = area.parameters.map((parameter) => {
        const copy = getParameterCopy(area.key, parameter.id)
        const storedParameter = Array.isArray(storedArea?.parameterScores)
          ? storedArea.parameterScores.find((entry: any) => entry.parameterId === parameter.id)
          : null
        const parameterScore = typeof storedParameter?.score === 'number'
          ? storedParameter.score
          : null
        const parameterPct = parameterScore === null ? null : round1((parameterScore / 10) * 100)

        return {
          id: parameter.id,
          name: copy.name,
          score: parameterScore,
          max: 10,
          pct: parameterPct,
          gap: parameterPct === null ? null : classifyAnalyticsGap(parameterPct),
          aspects: copy.aspects,
        }
      })

      return {
        key: area.key,
        name: getAreaCopy(area.key).name,
        level,
        score,
        max: area.maxPoints,
        pct,
        gap: classifyAnalyticsGap(pct),
        parameters,
      }
    })

  const total = areas.reduce((sum, area) => sum + area.score, 0)
  const max = LEVEL_MAX[level]
  const pct = round1(toPercentage(total, max))

  return {
    total,
    max,
    pct,
    gap: classifyAnalyticsGap(pct),
    areas,
  }
}

function normalizeStoredAnalysis(analysis: any): TADiagnosticAnalysis | null {
  if (!analysis?.overview) return null

  return {
    overview: {
      overallIndex: round1(Number(analysis.overview.overallIndex ?? analysis.overview.lendabilityIndex ?? 0)),
      classification: resolveClassification(
        analysis.overview.classification,
        analysis.overview.overallIndex ?? analysis.overview.lendabilityIndex,
      ),
      strategicTotal: Number(analysis.overview.strategicTotal ?? 0),
      strategicMax: Number(analysis.overview.strategicMax ?? LEVEL_MAX.strategic),
      strategicPct: round1(Number(analysis.overview.strategicPct ?? 0)),
      processTotal: Number(analysis.overview.processTotal ?? 0),
      processMax: Number(analysis.overview.processMax ?? LEVEL_MAX.process),
      processPct: round1(Number(analysis.overview.processPct ?? 0)),
      supportTotal: Number(analysis.overview.supportTotal ?? 0),
      supportMax: Number(analysis.overview.supportMax ?? LEVEL_MAX.support),
      supportPct: round1(Number(analysis.overview.supportPct ?? 0)),
      areas: Array.isArray(analysis.overview.areas) ? analysis.overview.areas : [],
    },
    strategic: analysis.strategic ?? null,
    process: analysis.process ?? null,
    support: analysis.support ?? null,
  }
}

function getAreaCopy(areaKey: CapacityAreaKey) {
  return ANALYTICS_COPY[areaKey]
}

function getParameterCopy(areaKey: CapacityAreaKey, parameterId: string) {
  return ANALYTICS_COPY[areaKey]?.parameters[parameterId] ?? {
    name: parameterId,
    aspects: [],
  }
}

function findAreaScore(areaScores: any[], areaKey: CapacityAreaKey) {
  return areaScores.find((entry) => entry?.areaKey === areaKey)
}

function resolveClassification(classification: any, index: any): AnalyticsOverview['classification'] {
  if (classification === 'investment_ready' || classification === 'conditionally_lendable' || classification === 'high_risk') {
    return classification
  }

  const numericIndex = Number(index ?? 0)
  if (numericIndex >= 80) return 'investment_ready'
  if (numericIndex >= 60) return 'conditionally_lendable'
  return 'high_risk'
}

function serializeBusiness(business: any): AnalyticsBusinessSummary {
  return {
    id: String(business._id),
    name: business.name ?? 'Unknown Business',
    sector: business.sector ?? 'Unknown Sector',
    ceoName: business.ceoName ?? '',
  }
}

async function resolveAssessorName(userId: unknown) {
  if (typeof userId !== 'string' || !userId || userId === 'anonymous') return null
  const assessor = await User.findOne({ clerkId: userId }).select('name role').lean() as any
  if (!assessor || !['bank_admin', 'bank_staff'].includes(assessor.role)) return null
  return typeof assessor.name === 'string' ? assessor.name : null
}

function parseStartDate(value: string | null) {
  if (!value) return null
  // Accept both YYYY-MM and YYYY-MM-DD
  const dateStr = value.length === 7 ? `${value}-01` : value
  const parsed = new Date(`${dateStr}T00:00:00.000Z`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function parseEndDate(value: string | null) {
  if (!value) return null
  // For YYYY-MM, use last day of that month
  if (value.length === 7) {
    const [y, m] = value.split('-').map(Number)
    const lastDay = new Date(Date.UTC(y, m, 0))
    lastDay.setUTCHours(23, 59, 59, 999)
    return lastDay
  }
  const parsed = new Date(`${value}T23:59:59.999Z`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function toIsoString(value: unknown) {
  const parsed = value instanceof Date ? value : new Date(String(value))
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString()
}

function toPercentage(score: number, max: number) {
  if (!max) return 0
  return (score / max) * 100
}

function round1(value: number) {
  return Math.round(value * 10) / 10
}
