import { AuditLog } from '@/models'

type AuditEntry = {
  actorClerkId?: string
  actorRole?: string
  tenantId?: string
  action: string
  resourceType: string
  resourceId?: string
  status?: 'success' | 'rejected' | 'failed'
  ipAddress?: string
  details?: Record<string, unknown>
}

export async function writeAuditLog(entry: AuditEntry) {
  try {
    await AuditLog.create({
      actorClerkId: entry.actorClerkId,
      actorRole: entry.actorRole,
      tenantId: entry.tenantId,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      status: entry.status ?? 'success',
      ipAddress: entry.ipAddress,
      details: entry.details ?? {},
    })
  } catch (error) {
    console.error('[AUDIT LOG ERROR]', error)
  }
}
