// src/lib/onboarding/steps.ts
// Shared onboarding step definitions used by API route and client pages

export const ONBOARDING_STEPS = [
  'theme_configured',
  'questions_imported',
  'test_diagnostic',
  'team_invited',
  'custom_domain',
] as const

export type OnboardingStep = typeof ONBOARDING_STEPS[number]
