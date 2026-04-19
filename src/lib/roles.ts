// src/lib/roles.ts
// InnoSL role constants, permission helpers, and display metadata

export const INNOSL_ROLES = [
  'platform_admin',
  'innosl_admin',
  'focal_person',
  'project_manager',
  'external_viewer',
] as const

export type InnoSLRole = typeof INNOSL_ROLES[number]

export const ASSIGNABLE_INNOSL_ROLES: InnoSLRole[] = [
  'innosl_admin',
  'focal_person',
  'project_manager',
  'external_viewer',
]

export function isInnoSLRole(role: string): boolean {
  return (INNOSL_ROLES as readonly string[]).includes(role)
}

// ── PERMISSION GATES ──────────────────────────────────────

export function canManageStaff(role: string)     { return role === 'platform_admin' }
export function canManageTenants(role: string)   { return role === 'platform_admin' }
export function canManageBilling(role: string)   { return role === 'platform_admin' }
export function canViewAuditLog(role: string)    { return role === 'platform_admin' }
export function canManageQuestions(role: string) {
  return ['platform_admin', 'innosl_admin'].includes(role)
}
export function canViewAllDiagnostics(role: string) {
  return ['platform_admin', 'innosl_admin', 'project_manager'].includes(role)
}
export function isExternalViewer(role: string)   { return role === 'external_viewer' }
export function hasSMEAssignments(role: string)  {
  return ['focal_person', 'external_viewer'].includes(role)
}
export function canViewAdminDashboard(role: string) {
  return ['platform_admin', 'innosl_admin', 'focal_person', 'project_manager'].includes(role)
}

// ── DISPLAY METADATA ──────────────────────────────────────

export const ROLE_LABELS: Record<string, string> = {
  platform_admin:  'Super Admin',
  innosl_admin:    'Admin',
  focal_person:    'Focal Person',
  project_manager: 'Project Manager',
  external_viewer: 'External Viewer',
  bank_admin:      'Bank Admin',
  bank_staff:      'Bank Staff',
  sme:             'SME',
}

export const ROLE_DESCRIPTIONS: Record<string, string> = {
  platform_admin:  'Full access — billing, tenants, staff, all data',
  innosl_admin:    'Diagnostics, tenants (read), question management',
  focal_person:    'Assigned SMEs only — incubation & acceleration',
  project_manager: 'All SMEs, TA management, programme oversight',
  external_viewer: 'Read-only view of assigned SMEs (UNDP, ILO, Banks)',
}

export const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  platform_admin:  { bg: '#EDE9FE', text: '#5B1FA8' },
  innosl_admin:    { bg: '#EFF6FF', text: '#185FA5' },
  focal_person:    { bg: '#E1F5EE', text: '#0F6E56' },
  project_manager: { bg: '#FFF7ED', text: '#C2410C' },
  external_viewer: { bg: '#F3F4F6', text: '#6B7280' },
  bank_admin:      { bg: '#FDF4FF', text: '#7E22CE' },
  bank_staff:      { bg: '#F3F4F6', text: '#6B7280' },
  sme:             { bg: '#FAEEDA', text: '#BA7517' },
}
