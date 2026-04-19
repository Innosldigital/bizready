import { writeAuditLog } from '@/lib/audit'
import { connectDB } from '@/lib/db'
import { buildTAProgrammeRecords } from '@/lib/ta/programmes'
import { Business, Diagnostic, TAProgramme, User } from '@/models'

export async function handleTACreation({
  userId,
  businessId,
  diagnosticId,
  ip,
  baseUrl,
}: {
  userId: string
  businessId: string
  diagnosticId: string
  ip: string
  baseUrl: string
}) {
  if (!businessId || !diagnosticId) {
    return { redirect: `${baseUrl}/bank/ta?error=missing-data` }
  }

  await connectDB()

  const user = await User.findOne({ clerkId: userId }).lean() as any
  if (!user?.tenantId) {
    return { redirect: `${baseUrl}/onboarding` }
  }

  const tenantId = String(user.tenantId)
  const diagnostic = await Diagnostic.findOne({
    _id: diagnosticId,
    businessId,
    tenantId,
  }).lean() as any

  if (!diagnostic) {
    return { redirect: `${baseUrl}/bank/ta/diagnosis/${businessId}?error=diagnostic-not-found` }
  }

  const recommendations = Array.isArray(diagnostic.result?.taRecommendations)
    ? diagnostic.result.taRecommendations
    : []

  if (recommendations.length === 0) {
    return { redirect: `${baseUrl}/bank/ta/diagnosis/${businessId}?error=no-recommendations` }
  }

  const existing = await TAProgramme.countDocuments({
    tenantId,
    businessId,
    diagnosticId,
  })

  if (existing > 0) {
    return { redirect: `${baseUrl}/bank/ta/diagnosis/${businessId}?ta=exists` }
  }

  await TAProgramme.insertMany(buildTAProgrammeRecords({
    tenantId,
    businessId,
    diagnosticId,
    assignedBy: userId,
    recommendations,
  }))

  await Business.findByIdAndUpdate(businessId, { taStatus: 'active' }).exec()

  await writeAuditLog({
    actorClerkId: userId,
    actorRole: user.role,
    tenantId: tenantId,
    action: 'ta_programme.created',
    resourceType: 'ta_programme',
    resourceId: diagnosticId,
    ipAddress: ip,
    details: {
      businessId,
      diagnosticId,
      programmeCount: recommendations.length,
    },
  })

  return { redirect: `${baseUrl}/bank/ta/diagnosis/${businessId}?ta=created` }
}