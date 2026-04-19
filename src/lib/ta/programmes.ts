type TARecommendationInput = {
  area: string
  parameterId?: string
  capacityLevel: string
  recommendation: string
  tools?: string[]
  timeframeWeeks?: number
}

type BuildTAProgrammeParams = {
  tenantId: string
  businessId: string
  diagnosticId: string
  assignedBy: string
  recommendations: TARecommendationInput[]
}

export function buildTAProgrammeRecords({
  tenantId,
  businessId,
  diagnosticId,
  assignedBy,
  recommendations,
}: BuildTAProgrammeParams) {
  return recommendations.map(rec => ({
    tenantId,
    businessId,
    diagnosticId,
    area: rec.area,
    parameterId: rec.parameterId,
    capacityLevel: rec.capacityLevel,
    recommendation: rec.recommendation,
    tools: Array.isArray(rec.tools) ? rec.tools : [],
    timeframeWeeks: Number(rec.timeframeWeeks ?? 4),
    progressPercent: 0,
    status: 'upcoming' as const,
    assignedBy,
  }))
}
