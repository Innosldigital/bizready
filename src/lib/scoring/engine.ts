// src/lib/scoring/engine.ts
// The core BizReady scoring engine — implements the MD's weighted formula

import type {
  DiagnosticResponse,
  DiagnosticSection,
  LendabilityResult,
  CapacityScore,
  TARecommendation,
  CapacityLevel,
} from '@/types'

// ── WEIGHTS (from MD's methodology) ──────────────────────
export const CAPACITY_WEIGHTS: Record<string, number> = {
  strategic:   0.30,
  operational: 0.45,
  support:     0.25,
}

// ── CLASSIFICATION THRESHOLDS ─────────────────────────────
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

// ── TA RECOMMENDATION LIBRARY ─────────────────────────────
const TA_LIBRARY: Record<string, Omit<TARecommendation, 'currentScore' | 'targetScore'>> = {
  finance: {
    area: 'Finance & accounting',
    capacityLevel: 'support',
    recommendation: 'Develop a financial management policy. Implement a digital accounting tool (Wave or QuickBooks). Train management on financial reporting and investor-ready record-keeping. Engage an external accountant for the first six months.',
    tools: ['Wave Accounting', 'QuickBooks', 'Sierra Leone Finance Act 2022'],
    timeframeWeeks: 8,
    priority: 'high',
  },
  hr: {
    area: 'Human resources & payroll',
    capacityLevel: 'support',
    recommendation: 'Draft a written HR strategy covering recruitment, payroll, performance appraisal and staff development. Implement a cloud-based HR management tool including digital payroll and biometric attendance.',
    tools: ['Cloudbase HR', 'SL Labour Laws Gazette 2020'],
    timeframeWeeks: 8,
    priority: 'high',
  },
  strategic: {
    area: 'Strategic planning',
    capacityLevel: 'strategic',
    recommendation: 'Develop a formal written business plan with 3–5 year goals. Conduct a strategic planning session with leadership to define mission, vision and strategic objectives using the Business Model Canvas.',
    tools: ['Business Model Canvas', 'Lean Canvas', 'OKR framework'],
    timeframeWeeks: 6,
    priority: 'medium',
  },
  leadership: {
    area: 'Management & leadership',
    capacityLevel: 'strategic',
    recommendation: 'Address key-man risk by building a management team structure. Introduce decision-making frameworks and delegation protocols. Document critical processes so the business can function without the founder.',
    tools: ['RACI matrix', 'Delegation framework', 'Process documentation templates'],
    timeframeWeeks: 4,
    priority: 'medium',
  },
  sales: {
    area: 'Marketing & sales',
    capacityLevel: 'operational',
    recommendation: 'Develop a documented sales and marketing strategy. Build a professional company website. Conduct structured market research to map the competitive landscape and identify new customer segments.',
    tools: ['Digital marketing toolkit', 'CRM system', 'Google Analytics'],
    timeframeWeeks: 6,
    priority: 'medium',
  },
  operations: {
    area: 'Operations & quality',
    capacityLevel: 'operational',
    recommendation: 'Implement a quality management system. Map all operational processes and identify bottlenecks. Explore technology solutions to improve efficiency and maintain capacity utilisation above 75%.',
    tools: ['QMS template', 'Process mapping software', 'Lean Six Sigma basics'],
    timeframeWeeks: 8,
    priority: 'medium',
  },
  compliance: {
    area: 'Regulatory compliance',
    capacityLevel: 'support',
    recommendation: 'Ensure full business registration and licensing compliance. Resolve any outstanding NASSIT, NRA or sector-specific regulatory gaps. Develop a compliance calendar and assign a compliance officer.',
    tools: ['NRA compliance guide', 'NASSIT registration checklist'],
    timeframeWeeks: 3,
    priority: 'critical',
  },
  governance: {
    area: 'Corporate governance',
    capacityLevel: 'support',
    recommendation: 'Separate personal and business finances immediately — open a dedicated business bank account. Establish corporate governance documentation including board minutes, shareholder agreements, and a company constitution.',
    tools: ['Corporate governance template', 'Business bank account setup guide'],
    timeframeWeeks: 2,
    priority: 'critical',
  },
}

// ── MAIN SCORING FUNCTION ─────────────────────────────────
export function calculateLendabilityIndex(
  responses: DiagnosticResponse[],
  sections: DiagnosticSection[],
): LendabilityResult {
  // Group responses by capacity level
  const byLevel: Record<string, DiagnosticResponse[]> = {
    strategic: [], operational: [], support: [],
  }

  for (const response of responses) {
    const section = sections.find(s =>
      s.questions.some(q => q._id === response.questionId)
    )
    if (section && byLevel[section.capacityLevel] !== undefined) {
      byLevel[section.capacityLevel].push(response)
    }
  }

  // Calculate score per capacity level
  const strategic   = calcCapacityScore('strategic',   byLevel.strategic,   sections)
  const operational = calcCapacityScore('operational', byLevel.operational, sections)
  const support     = calcCapacityScore('support',     byLevel.support,     sections)

  // Weighted lendability index: S×30% + O×45% + Su×25%
  const lendabilityIndex = Math.round(
    strategic.percentage   * CAPACITY_WEIGHTS.strategic   +
    operational.percentage * CAPACITY_WEIGHTS.operational +
    support.percentage     * CAPACITY_WEIGHTS.support
  )

  const classification = classify(lendabilityIndex)

  // Identify bottleneck (lowest scoring area)
  const scores = { strategic: strategic.percentage, operational: operational.percentage, support: support.percentage }
  const bottleneck = Object.entries(scores).reduce((a, b) => a[1] < b[1] ? a : b)[0] as CapacityLevel

  // Build TA recommendations for areas below 70%
  const taRecommendations = buildTARecommendations(strategic, operational, support)

  // Project score after TA completion (assume gaps addressed to 80%)
  const projectedStrategic   = Math.max(strategic.percentage,   80)
  const projectedOperational = Math.max(operational.percentage, 80)
  const projectedSupport     = Math.max(support.percentage,     80)
  const projectedIndexAfterTA = Math.round(
    projectedStrategic   * CAPACITY_WEIGHTS.strategic   +
    projectedOperational * CAPACITY_WEIGHTS.operational +
    projectedSupport     * CAPACITY_WEIGHTS.support
  )

  return {
    lendabilityIndex,
    classification,
    strategic,
    operational,
    support,
    bottleneck,
    projectedIndexAfterTA,
    taRecommendations,
  }
}

function calcCapacityScore(
  level: CapacityLevel,
  responses: DiagnosticResponse[],
  sections: DiagnosticSection[],
): CapacityScore {
  const section = sections.find(s => s.capacityLevel === level)
  const weight  = CAPACITY_WEIGHTS[level] || 0
  const maxScore = section?.maxPoints || (responses.length * 5)

  if (responses.length === 0) {
    return { level, rawScore: 0, maxScore, percentage: 0, weight, weightedContribution: 0 }
  }

  const rawScore = responses.reduce((sum, r) => sum + (r.score || 0), 0)
  const percentage = Math.min(Math.round((rawScore / maxScore) * 100), 100)
  const weightedContribution = Math.round(percentage * weight * 10) / 10

  return { level, rawScore, maxScore, percentage, weight, weightedContribution }
}

function buildTARecommendations(
  strategic: CapacityScore,
  operational: CapacityScore,
  support: CapacityScore,
): TARecommendation[] {
  const recs: TARecommendation[] = []
  const threshold = 70

  if (support.percentage < threshold) {
    if (support.percentage < 50) {
      recs.push({ ...TA_LIBRARY.governance, currentScore: support.percentage, targetScore: 80 })
      recs.push({ ...TA_LIBRARY.compliance, currentScore: support.percentage, targetScore: 80 })
    }
    recs.push({ ...TA_LIBRARY.finance, currentScore: support.percentage, targetScore: 80 })
    recs.push({ ...TA_LIBRARY.hr,      currentScore: support.percentage, targetScore: 80 })
  }

  if (strategic.percentage < threshold) {
    recs.push({ ...TA_LIBRARY.strategic,   currentScore: strategic.percentage,   targetScore: 80 })
    recs.push({ ...TA_LIBRARY.leadership,  currentScore: strategic.percentage,   targetScore: 80 })
  }

  if (operational.percentage < threshold) {
    recs.push({ ...TA_LIBRARY.sales,       currentScore: operational.percentage, targetScore: 80 })
    recs.push({ ...TA_LIBRARY.operations,  currentScore: operational.percentage, targetScore: 80 })
  }

  // Sort by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
  return recs.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
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
    return `Congratulations — your business has reached Investment Ready status! All three capacity areas are performing strongly. You are eligible to apply for a loan at your bank today. A relationship manager will contact you shortly.`
  }
  if (index >= 60) {
    return `You are close to loan-ready status with a score of ${index}%. Your ${bottleneck} capacity is the main area holding you back. Completing the recommended TA programme will push your score above 80% and make you fully eligible for a loan — estimated 8–12 weeks.`
  }
  return `Your business has significant gaps across multiple areas, with ${bottleneck} being the most critical. InnovationSL will work with you on a structured development plan. With focused support, you can reach loan-ready status within 6 months.`
}
