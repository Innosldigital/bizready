import { writeAuditLog } from '@/lib/audit'
import { validateBankSettingsInput } from '@/lib/bank/settings'
import { connectDB } from '@/lib/db'
import { Tenant, User } from '@/models'

export async function handleBankSettingsUpdate({
  userId,
  body,
  ip,
}: {
  userId: string
  body: any
  ip: string
}) {
  const { isValid, normalized } = validateBankSettingsInput(body ?? {})
  const { bankName, contactEmail, country, tagline } = normalized

  if (!isValid) {
    return { error: 'Bank name, contact email, and country are required.', status: 400 }
  }

  await connectDB()

  const user = await User.findOne({ clerkId: userId }).lean() as any
  if (!user || !user.tenantId || !['bank_admin', 'bank_staff'].includes(user.role)) {
    return { error: 'Forbidden', status: 403 }
  }

  const updatedTenant = (await Tenant.findByIdAndUpdate(
    user.tenantId,
    {
      $set: {
        contactEmail,
        country,
        'theme.bankName': bankName,
        'theme.tagline': tagline || undefined,
      },
    },
    { new: true }
  ).lean()) as any

  if (!updatedTenant) {
    return { error: 'Tenant not found', status: 404 }
  }

  await writeAuditLog({
    actorClerkId: userId,
    actorRole: user.role,
    tenantId: String(user.tenantId),
    action: 'tenant.settings.updated',
    resourceType: 'tenant',
    resourceId: String(updatedTenant._id),
    ipAddress: ip,
    details: {
      bankName,
      contactEmail,
      country,
      tagline: tagline || '',
    },
  })

  return {
    success: true,
    tenant: {
      _id: String(updatedTenant._id),
      contactEmail: updatedTenant.contactEmail,
      country: updatedTenant.country,
      theme: {
        bankName: updatedTenant.theme.bankName,
        tagline: updatedTenant.theme.tagline ?? '',
      },
    },
  }
}