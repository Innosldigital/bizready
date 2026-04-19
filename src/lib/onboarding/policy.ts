export function parsePlatformAdminEmails(csv: string) {
  return csv
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean)
}

export function resolveOnboardingRole(email: string, platformAdminEmailsCsv: string) {
  const normalizedEmail = email.trim().toLowerCase()
  const adminEmails = parsePlatformAdminEmails(platformAdminEmailsCsv)
  return adminEmails.includes(normalizedEmail) ? 'platform_admin' : null
}
