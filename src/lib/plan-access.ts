import { PLANS, type PlanTier } from '@/types'

const PLAN_ORDER: PlanTier[] = ['starter', 'growth', 'enterprise', 'owner']

export function isPlanAtLeast(plan: PlanTier, required: PlanTier) {
  return PLAN_ORDER.indexOf(plan) >= PLAN_ORDER.indexOf(required)
}

export function canAccessTA(plan: PlanTier) {
  return isPlanAtLeast(plan, 'growth')
}

export function canAccessReports(plan: PlanTier) {
  return isPlanAtLeast(plan, 'growth')
}

export function canAccessFullAnalytics(plan: PlanTier) {
  return isPlanAtLeast(plan, 'growth')
}

export function canAccessApi(plan: PlanTier) {
  return isPlanAtLeast(plan, 'enterprise')
}

export function submissionLimit(plan: PlanTier) {
  const limit = PLANS[plan]?.submissionsPerMonth
  return limit === 'unlimited' ? null : limit
}

export function getPlanFeatures(plan: PlanTier) {
  return PLANS[plan]?.features ?? []
}
