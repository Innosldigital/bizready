// src/lib/scoring/engine.ts
// BizReady Scoring Engine - calculates lendability index and identifies capacity gaps
// Lendability// Index = (Strategic/90 * 0.30 + Process/170 * 0.45 + Support/200 * 0.25) * 100

import type {
  DiagnosticResponse,
  DiagnosticSection,
  LendabilityResult,
  CapacityScore,
  AreaScore,
  ParameterScore,
  TARecommendation,
  GapClassification,
  CapacityAreaKey,
} from '@/types'
import { CAPACITY_AREAS, LEVEL_MAX, LEVEL_WEIGHTS, classifyGap } from '@/types'

// ── CLASSIFICATION THRESHOLDS ─────────────────────────────
// Gap classification per InvestSalone methodology:
// 0–49%  = High Priority Gap  (red  #A32D2D)
// 50–79% = Low Priority Gap   (amber #BA7517)
// 80–100%= Ideal Performance  (green #0F6E56)

export { classifyGap }

export function classify(index: number): LendabilityResult['classification'] {
  if (index >= 80) return 'investment_ready'
  if (index >= 60) return 'conditionally_lendable'
  return 'high_risk'
}

export function classificationLabel(c: LendabilityResult['classification']): string {
  return {
    investment_ready:       'Investment Ready',
    conditionally_lendable: 'Conditionally Lendable',
    high_risk:              'High Risk',
  }[c]
}

export function classificationColour(c: LendabilityResult['classification']): string {
  return {
    investment_ready:       '#0F6E56',
    conditionally_lendable: '#BA7517',
    high_risk:              '#A32D2D',
  }[c]
}

// ── MAIN SCORING FUNCTION ─────────────────────────────────
// Accepts parameter-level responses with areaId + score (0–10 per parameter)
export function calculateLendabilityIndex(
  responses: DiagnosticResponse[],
  sections:  DiagnosticSection[],
  customWeights?: { strategic?: number; process?: number; support?: number },
): LendabilityResult {

  // Build a map of parameterId/questionId → score from responses
  const scoreByParam: Record<string, { score: number; areaId: string }> = {}
  for (const r of responses) {
    const key = r.parameterId || r.questionId
    const areaId = r.areaId || resolveAreaFromSections(r.questionId, sections)
    if (key) {
      scoreByParam[key] = { score: r.score, areaId }
    }
  }

  // Compute per-area scores using CAPACITY_AREAS definition
  const areaScores: AreaScore[] = CAPACITY_AREAS.map(area => {
    const parameterScores: ParameterScore[] = area.parameters.map(param => {
      const entry = scoreByParam[param.id] || scoreByParam[`${area.key}.${param.id}`]
      const score = entry?.score ?? 0
      return {
        parameterId: param.id,
        parameterName: param.name,
        score: Math.min(10, Math.max(0, score)),
        gapClassification: classifyGap((score / 10) * 100),
      }
    })

    const rawScore   = parameterScores.reduce((s, p) => s + p.score, 0)
    const percentage = area.maxPoints > 0
      ? Math.min(100, Math.round((rawScore / area.maxPoints) * 100))
      : 0

    return {
      areaKey:           area.key,
      areaName:          area.name,
      areaNumber:        area.number,
      level:             area.level,
      rawScore,
      maxScore:          area.maxPoints,
      percentage,
      gapClassification: classifyGap(percentage),
      parameterScores,
    }
  })

  // Resolve weights — tenant overrides take effect for enterprise plans
  const weights = {
    strategic: customWeights?.strategic ?? LEVEL_WEIGHTS.strategic,
    process:   customWeights?.process   ?? LEVEL_WEIGHTS.process,
    support:   customWeights?.support   ?? LEVEL_WEIGHTS.support,
  }

  // Compute level totals
  const levels = ['strategic', 'process', 'support'] as const
  const levelScores: Record<string, CapacityScore> = {}

  for (const lvl of levels) {
    const lvlAreas   = areaScores.filter(a => a.level === lvl)
    const rawScore   = lvlAreas.reduce((s, a) => s + a.rawScore, 0)
    const maxScore   = LEVEL_MAX[lvl]
    const weight     = weights[lvl]
    const percentage = maxScore > 0
      ? Math.min(100, Math.round((rawScore / maxScore) * 100))
      : 0
    levelScores[lvl] = {
      level: lvl,
      rawScore,
      maxScore,
      percentage,
      weight,
      weightedContribution: Math.round(percentage * weight * 10) / 10,
      gapClassification: classifyGap(percentage),
    }
  }

  // Weighted Lendability Index using resolved weights
  const lendabilityIndex = Math.round(
    levelScores.strategic.percentage * weights.strategic +
    levelScores.process.percentage   * weights.process   +
    levelScores.support.percentage   * weights.support
  )

  const classification = classify(lendabilityIndex)

  // Bottleneck = lowest-scoring level
  const bottleneck = levels.reduce((a, b) =>
    levelScores[a].percentage <= levelScores[b].percentage ? a : b
  )

  // TA Recommendations - for all params scoring < 8/10 (< 80%)
  const taRecommendations = buildTARecommendations(areaScores)

  // Projected index after TA (all gaps raised to score of 8/10 = 80%)
  const projectedStrategic = Math.max(levelScores.strategic.percentage, 80)
  const projectedProcess   = Math.max(levelScores.process.percentage,   80)
  const projectedSupport   = Math.max(levelScores.support.percentage,   80)
  const projectedIndexAfterTA = Math.round(
    projectedStrategic * weights.strategic +
    projectedProcess   * weights.process   +
    projectedSupport   * weights.support
  )

  return {
    lendabilityIndex,
    classification,
    strategic:  levelScores.strategic,
    process:    levelScores.process,
    operational: levelScores.process,  // backward compat alias
    support:    levelScores.support,
    areaScores,
    bottleneck,
    projectedIndexAfterTA,
    taRecommendations,
  }
}

// ── HELPERS ───────────────────────────────────────────────

// Fallback: resolve areaId by looking up which section a question belongs to
function resolveAreaFromSections(questionId: string, sections: DiagnosticSection[]): string {
  for (const section of sections) {
    if (section.questions?.some(q => q._id === questionId)) {
      return (section as any).areaId || section.name
    }
  }
  return ''
}

// ── TA RECOMMENDATION LIBRARY ─────────────────────────────
const TA_LIBRARY: Record<string, Omit<TARecommendation, 'currentScore' | 'targetScore' | 'parameterId'>> = {
  // Strategic
  missionVision: {
    area: 'Mission & Vision (Strategic Management)',
    capacityLevel: 'strategic',
    recommendation: 'Define and document the company mission and vision statements. Socialise the mission across all staff levels. Develop a Business Model Canvas and articulate clear strategic goals.',
    tools: ['Business Model Canvas', 'Simon Sinek Golden Circle', 'Strategic planning templates'],
    timeframeWeeks: 4,
    priority: 'high',
  },
  companyHistory: {
    area: 'Company History (Strategic Management)',
    capacityLevel: 'strategic',
    recommendation: 'Document the company founding story, key milestones, and growth trajectory. Create a company profile document for external stakeholders.',
    tools: ['Company profile template', 'Timeline tool'],
    timeframeWeeks: 2,
    priority: 'medium',
  },
  strategicPlanning: {
    area: 'Strategic Planning (Strategic Management)',
    capacityLevel: 'strategic',
    recommendation: 'Develop a formal 3–5 year strategic plan with measurable objectives. Align operational activities with strategic goals. Review annually.',
    tools: ['OKR framework', 'Balanced Scorecard', 'SWOT analysis template'],
    timeframeWeeks: 6,
    priority: 'high',
  },
  leadershipStyle: {
    area: 'Leadership Style (Management & Leadership)',
    capacityLevel: 'strategic',
    recommendation: 'Adopt a more participatory leadership approach. Document criteria for assigning responsibilities. Build a management team structure to reduce key-man risk.',
    tools: ['RACI matrix', 'Leadership assessment tools', 'Management team charter'],
    timeframeWeeks: 4,
    priority: 'medium',
  },
  autonomy: {
    area: 'Autonomy (Management & Leadership)',
    capacityLevel: 'strategic',
    recommendation: 'Establish clear decision-making frameworks with defined levels of authority. Delegate operational decisions to managers while owner focuses on strategy.',
    tools: ['Delegation framework', 'Decision rights matrix'],
    timeframeWeeks: 3,
    priority: 'medium',
  },
  managementTools: {
    area: 'Management Tools (Management & Leadership)',
    capacityLevel: 'strategic',
    recommendation: 'Implement management information systems for decision-making. Use dashboards, KPIs, and regular reporting to guide business decisions.',
    tools: ['KPI dashboard templates', 'Management reporting tools', 'Data analytics basics'],
    timeframeWeeks: 4,
    priority: 'medium',
  },
  regulationInstitution: {
    area: 'Regulation and Institutionalism (Business Environment)',
    capacityLevel: 'strategic',
    recommendation: 'Conduct a full regulatory compliance review. Register with all relevant bodies (SLIEPA, NASSIT, NRA). Maintain relationships with key institutions.',
    tools: ['Sierra Leone regulatory compliance guide', 'SLIEPA registration checklist'],
    timeframeWeeks: 3,
    priority: 'critical',
  },
  sectorUnderstanding: {
    area: 'Understanding of the Sector (Business Environment)',
    capacityLevel: 'strategic',
    recommendation: 'Conduct structured market research. Monitor sector trends, macroeconomic indicators, and competitors. Subscribe to industry reports.',
    tools: ['Market research template', 'PESTLE analysis', 'Sector reports'],
    timeframeWeeks: 4,
    priority: 'medium',
  },
  alliances: {
    area: 'Alliances (Business Environment)',
    capacityLevel: 'strategic',
    recommendation: 'Map and evaluate current strategic partnerships. Identify and pursue new alliance opportunities. Document formal agreements with key partners.',
    tools: ['Partnership evaluation matrix', 'MOU template'],
    timeframeWeeks: 3,
    priority: 'low',
  },
  // Process - Production
  suppliers: {
    area: 'Suppliers (Production & Operations)',
    capacityLevel: 'process',
    recommendation: 'Develop supplier selection criteria and a formal procurement plan. Implement supplier compliance monitoring and materials reception protocols.',
    tools: ['Supplier evaluation template', 'Procurement planning tools'],
    timeframeWeeks: 4,
    priority: 'medium',
  },
  inventoryHandling: {
    area: 'Inventory Handling (Production & Operations)',
    capacityLevel: 'process',
    recommendation: 'Implement inventory management system. Introduce systematic stock-taking and warehouse organisation. Use FIFO or other inventory control methods.',
    tools: ['Inventory management software', 'Stock control templates'],
    timeframeWeeks: 4,
    priority: 'medium',
  },
  productPlanning: {
    area: 'Product Planning (Production & Operations)',
    capacityLevel: 'process',
    recommendation: 'Implement demand forecasting and master production planning. Develop material requirements planning (MRP) and improve product/service development processes.',
    tools: ['Production planning templates', 'Demand forecasting tools'],
    timeframeWeeks: 5,
    priority: 'medium',
  },
  plantLayout: {
    area: 'Plant Layout (Production & Operations)',
    capacityLevel: 'process',
    recommendation: 'Optimise physical workspace layout for workflow efficiency. Document plant layout diagram. Plan for physical expansion capacity.',
    tools: ['Lean workplace design', 'Process flow mapping'],
    timeframeWeeks: 3,
    priority: 'low',
  },
  technologicalLevel: {
    area: 'Technological Level (Production & Operations)',
    capacityLevel: 'process',
    recommendation: 'Assess current equipment age and condition. Develop an equipment procurement and upgrade plan. Maintain manuals and maintenance records.',
    tools: ['Asset management template', 'Equipment lifecycle planning'],
    timeframeWeeks: 4,
    priority: 'medium',
  },
  machineryMaintenance: {
    area: 'Machinery Maintenance (Production & Operations)',
    capacityLevel: 'process',
    recommendation: 'Develop a formal preventive maintenance plan. Train maintenance personnel. Improve coordination between production and maintenance departments.',
    tools: ['Preventive maintenance schedule template', 'TPM methodology'],
    timeframeWeeks: 4,
    priority: 'medium',
  },
  // Process - Marketing & Sales
  clientRelationship: {
    area: 'Client Relationship (Marketing & Sales)',
    capacityLevel: 'process',
    recommendation: 'Implement a formal client service policy. Introduce customer satisfaction surveys and a CRM system to track client relationships.',
    tools: ['CRM system (HubSpot Free)', 'Customer satisfaction survey template'],
    timeframeWeeks: 4,
    priority: 'high',
  },
  strategicSegmentation: {
    area: 'Strategic Segmentation (Marketing & Sales)',
    capacityLevel: 'process',
    recommendation: 'Conduct market segmentation analysis. Define target markets and develop a clear positioning strategy.',
    tools: ['Market segmentation template', 'Value proposition canvas'],
    timeframeWeeks: 4,
    priority: 'high',
  },
  productsServices: {
    area: 'Products/Services (Marketing & Sales)',
    capacityLevel: 'process',
    recommendation: 'Align product development with marketing strategy. Establish feedback loops between sales and production teams for continuous improvement.',
    tools: ['Product roadmap template', 'Voice of customer tools'],
    timeframeWeeks: 4,
    priority: 'medium',
  },
  price: {
    area: 'Price (Marketing & Sales)',
    capacityLevel: 'process',
    recommendation: 'Develop a cost-based pricing model. Conduct competitive price studies. Adjust pricing based on market positioning and product features.',
    tools: ['Pricing strategy toolkit', 'Cost analysis template'],
    timeframeWeeks: 3,
    priority: 'medium',
  },
  salesManagement: {
    area: 'Sales Management (Marketing & Sales)',
    capacityLevel: 'process',
    recommendation: 'Build a sales management system with clear targets, tracking, and regular reporting. Train sales staff and develop sales support materials.',
    tools: ['Sales CRM', 'Sales training curriculum', 'Sales pipeline template'],
    timeframeWeeks: 5,
    priority: 'high',
  },
  communications: {
    area: 'Communications (Marketing & Sales)',
    capacityLevel: 'process',
    recommendation: 'Develop a marketing communication plan. Ensure consistency across all channels. Allocate a communications budget.',
    tools: ['Marketing plan template', 'Brand guidelines', 'Social media calendar'],
    timeframeWeeks: 4,
    priority: 'medium',
  },
  distribution: {
    area: 'Distribution (Marketing & Sales)',
    capacityLevel: 'process',
    recommendation: 'Map and optimise distribution channels. Formalise contracts with distributors. Provide product training to distribution partners.',
    tools: ['Distribution channel analysis', 'Distributor agreement template'],
    timeframeWeeks: 4,
    priority: 'medium',
  },
  exports: {
    area: 'Exports (Marketing & Sales)',
    capacityLevel: 'process',
    recommendation: 'Develop an export readiness plan. Research target markets and trade regulations. Develop an export strategy and distribution plan.',
    tools: ['SLIEPA export guide', 'Export readiness assessment', 'Trade finance toolkit'],
    timeframeWeeks: 6,
    priority: 'low',
  },
  // Process - Environmental
  envRegulations: {
    area: 'Environmental Regulations (Environmental Management)',
    capacityLevel: 'process',
    recommendation: 'Develop an environmental policy. Register environmental parameters. Address any community complaints and obtain necessary health citations.',
    tools: ['EPA Sierra Leone guidelines', 'Environmental compliance checklist'],
    timeframeWeeks: 4,
    priority: 'high',
  },
  wasteManagement: {
    area: 'Waste Management (Environmental Management)',
    capacityLevel: 'process',
    recommendation: 'Conduct waste audit. Document waste types, origins, and implement treatment protocols. Develop pollution prevention procedures.',
    tools: ['Waste audit template', 'Pollution prevention guidelines'],
    timeframeWeeks: 4,
    priority: 'medium',
  },
  occupationalRisk: {
    area: 'Occupational Risk & Health (Environmental Management)',
    capacityLevel: 'process',
    recommendation: 'Hire or designate a health and safety officer. Conduct risk assessments and implement training. Ensure PPE provision and ventilation standards.',
    tools: ['OSH Act Sierra Leone', 'Risk assessment template', 'Safety training modules'],
    timeframeWeeks: 4,
    priority: 'high',
  },
  // Support - Org Structure
  divisionOfLabor: {
    area: 'Division of Labor (Organizational Structure)',
    capacityLevel: 'support',
    recommendation: 'Document the internal organisational structure. Formalise job descriptions and reporting lines. Develop an organisational chart.',
    tools: ['Org chart tool', 'Job description templates'],
    timeframeWeeks: 2,
    priority: 'medium',
  },
  decisionMakingPower: {
    area: 'Decision Making Power (Organizational Structure)',
    capacityLevel: 'support',
    recommendation: 'Document the decision-making process. Involve relevant personnel in key decisions. Implement a management committee structure.',
    tools: ['Decision rights matrix', 'Committee terms of reference template'],
    timeframeWeeks: 2,
    priority: 'medium',
  },
  // Support - Finance
  legalTaxLegislation: {
    area: 'Legal and Tax Legislation (Finance)',
    capacityLevel: 'support',
    recommendation: 'Ensure all legal records are maintained. Clarify tax obligations and implement tax planning and control measures. Engage a tax advisor.',
    tools: ['NRA compliance guide', 'Tax planning calendar', 'Legal records checklist'],
    timeframeWeeks: 3,
    priority: 'critical',
  },
  accountingRecords: {
    area: 'Accounting Records (Finance)',
    capacityLevel: 'support',
    recommendation: 'Implement digital accounting software. Ensure all transactions are recorded including sales tax. Assign a qualified bookkeeper. Generate timely financial reports.',
    tools: ['Wave Accounting (free)', 'QuickBooks', 'Bookkeeping training modules'],
    timeframeWeeks: 6,
    priority: 'high',
  },
  costs: {
    area: 'Costs (Finance)',
    capacityLevel: 'support',
    recommendation: 'Establish a costing system. Maintain detailed cost registers and generate regular cost analysis reports. Use cost data for pricing and decision-making.',
    tools: ['Cost analysis template', 'Unit cost calculation tool'],
    timeframeWeeks: 4,
    priority: 'high',
  },
  financialAdmin: {
    area: 'Financial Administration (Finance)',
    capacityLevel: 'support',
    recommendation: 'Develop annual budgets and income statements. Establish an investment policy. Conduct regular analysis of financial performance indicators.',
    tools: ['Budget template', 'Financial ratio analysis tool', 'Investment policy template'],
    timeframeWeeks: 5,
    priority: 'high',
  },
  // Support - HR
  staffPerformance: {
    area: 'Staff Performance (Human Resources)',
    capacityLevel: 'support',
    recommendation: 'Assess technical competence of all staff. Ensure personnel are deployed to roles that utilise their skills. Address skill gaps through targeted training.',
    tools: ['Competency assessment tool', 'Training needs analysis template'],
    timeframeWeeks: 3,
    priority: 'medium',
  },
  personnelPolicy: {
    area: 'Personnel Policy (Human Resources)',
    capacityLevel: 'support',
    recommendation: 'Develop formal HR policies covering recruitment, selection, orientation, promotion, training, and employment terms. Implement consistently.',
    tools: ['HR policy template', 'SL Labour Laws Gazette 2020', 'Employee handbook template'],
    timeframeWeeks: 4,
    priority: 'high',
  },
  personnelBenefits: {
    area: 'Personnel Benefits & Incentives (Human Resources)',
    capacityLevel: 'support',
    recommendation: 'Design an incentive and recognition programme. Conduct staff motivation surveys. Implement performance evaluation and competitive compensation structure.',
    tools: ['Compensation benchmarking tool', 'Performance review template'],
    timeframeWeeks: 4,
    priority: 'medium',
  },
  corporateClimate: {
    area: 'Corporate Climate (Human Resources)',
    capacityLevel: 'support',
    recommendation: 'Measure employee satisfaction and sense of belonging. Address turnover drivers. Create initiatives to improve workplace culture and staff retention.',
    tools: ['Employee engagement survey', 'Culture assessment tools'],
    timeframeWeeks: 3,
    priority: 'medium',
  },
  // Support - Info Management
  information: {
    area: 'Information (Information Management)',
    capacityLevel: 'support',
    recommendation: 'Establish information management systems for internal and external data. Implement structured data processing and reporting to support decision-making.',
    tools: ['Knowledge management tools', 'Reporting dashboard templates'],
    timeframeWeeks: 3,
    priority: 'medium',
  },
  communication: {
    area: 'Communication (Information Management)',
    capacityLevel: 'support',
    recommendation: 'Improve communication speed and fluency across departments. Implement regular team briefings and digital communication tools.',
    tools: ['Internal communication tools (Slack, Teams)', 'Meeting management templates'],
    timeframeWeeks: 2,
    priority: 'low',
  },
  // Support - Quality
  qualityControl: {
    area: 'Quality Control (Quality Management)',
    capacityLevel: 'support',
    recommendation: 'Develop a quality control policy. Appoint a quality supervisor. Implement systematic procedures for handling rejected products.',
    tools: ['QC policy template', 'Rejection procedure guide'],
    timeframeWeeks: 4,
    priority: 'high',
  },
  procedures: {
    area: 'Procedures (Quality Management)',
    capacityLevel: 'support',
    recommendation: 'Document quality procedures. Acquire measurement instruments. Implement systematic quality checks and quality assurance operations.',
    tools: ['ISO 9001 basics', 'Quality procedure templates', 'SOP templates'],
    timeframeWeeks: 5,
    priority: 'medium',
  },
  productQuality: {
    area: 'Product Quality (Quality Management)',
    capacityLevel: 'support',
    recommendation: 'Establish product quality check protocols. Maintain quality records. Implement a product guarantee policy to build customer trust.',
    tools: ['Product quality checklist', 'Customer guarantee templates'],
    timeframeWeeks: 3,
    priority: 'medium',
  },
  // Support - Tech Innovation
  technologicalStrategy: {
    area: 'Technological Strategy (Technological Innovation)',
    capacityLevel: 'support',
    recommendation: 'Incorporate innovation and technology into the strategic plan. Define a strategic product development roadmap.',
    tools: ['Technology roadmap template', 'Innovation strategy canvas'],
    timeframeWeeks: 4,
    priority: 'medium',
  },
  innovationCulture: {
    area: 'Innovation Culture (Technological Innovation)',
    capacityLevel: 'support',
    recommendation: 'Foster client feedback loops for product improvement. Train staff technically. Implement process improvement programmes. Recognise innovation contributions.',
    tools: ['Innovation culture assessment', 'Kaizen methodology'],
    timeframeWeeks: 6,
    priority: 'medium',
  },
  systemInfrastructure: {
    area: 'System & Infrastructure (Technological Innovation)',
    capacityLevel: 'support',
    recommendation: 'Establish a development unit. Build relationships with technological institutions and quality testing laboratories. Explore joint tech ventures.',
    tools: ['R&D partnership directory', 'Quality lab contact list'],
    timeframeWeeks: 5,
    priority: 'low',
  },
  innovationExecution: {
    area: 'Innovation Project Execution (Technological Innovation)',
    capacityLevel: 'support',
    recommendation: 'Allocate innovation budgets. Identify relevant credits and subsidies. Build a portfolio of innovation projects with formal administration.',
    tools: ['Innovation project management template', 'SME grant database SL'],
    timeframeWeeks: 6,
    priority: 'medium',
  },
  informationTech: {
    area: 'Information Technologies (Technological Innovation)',
    capacityLevel: 'support',
    recommendation: 'Assess and improve use of information technologies. Identify digital tools that create business value. Develop an IT investment plan.',
    tools: ['Digital transformation checklist', 'SME tech toolkit'],
    timeframeWeeks: 4,
    priority: 'medium',
  },
}

function buildTARecommendations(areaScores: AreaScore[]): TARecommendation[] {
  const recs: TARecommendation[] = []

  for (const area of areaScores) {
    for (const param of area.parameterScores) {
      if (param.score >= 8) continue  // Ideal performance, no TA needed

      const lib = TA_LIBRARY[param.parameterId]
      if (!lib) continue

      recs.push({
        ...lib,
        parameterId:  param.parameterId,
        currentScore: param.score,
        targetScore:  8,
      })
    }
  }

  // Sort: critical → high → medium → low, then within same priority by score ascending
  const order = { critical: 0, high: 1, medium: 2, low: 3 }
  return recs.sort((a, b) => {
    const pd = order[a.priority] - order[b.priority]
    return pd !== 0 ? pd : a.currentScore - b.currentScore
  })
}

// ── BANK RECOMMENDATION TEXT ──────────────────────────────
export function getBankRecommendationText(index: number): string {
  if (index >= 80) {
    return 'This business qualifies for a standard credit appraisal. All three capacity levels demonstrate strong fundamentals. Proceed with full due diligence. No TA preconditions required.'
  }
  if (index >= 60) {
    return 'This business qualifies for conditional lending. Activate the recommended TA support plan alongside or prior to loan disbursement. Re-assess at the 8-week mark to verify progress.'
  }
  return 'This business requires significant capacity building before it is eligible for credit. Recommend enrolment in a structured InnoSL incubation programme. Reassess after programme completion (estimated 6 months).'
}

export function getSMEFeedbackText(index: number, bottleneck: string): string {
  if (index >= 80) {
    return `Congratulations - your business has reached Investment Ready status! All three capacity areas are performing strongly. You are eligible to apply for a loan at your bank today.`
  }
  if (index >= 60) {
    return `You are close to loan-ready status with a score of ${index}%. Your ${bottleneck} capacity is the main area holding you back. Completing the recommended TA programme will push your score above 80%.`
  }
  return `Your business has significant gaps across multiple areas, with ${bottleneck} being the most critical. InnovationSL will work with you on a structured development plan. With focused support, you can reach loan-ready status within 6 months.`
}

// ── CAPACITY WEIGHTS EXPORT (back-compat) ────────────────
export const CAPACITY_WEIGHTS: Record<string, number> = {
  strategic: 0.30,
  process:   0.45,
  operational: 0.45,  // alias
  support:   0.25,
}

export { CAPACITY_AREAS, LEVEL_MAX, LEVEL_WEIGHTS }
