'use client'
// src/app/bank/onboarding-setup/OnboardingChecklistClient.tsx

import { useState } from 'react'
import Link from 'next/link'

interface Step {
  key: string
  title: string
  description: string
  action: React.ReactNode
  enterpriseOnly?: boolean
}

interface Props {
  tenantName:          string
  tenantSlug:          string
  plan:                string
  completedSteps:      string[]
  isEnterprise:        boolean
  successManagerName?: string
  successManagerEmail?: string
  primaryColor:        string
}

export default function OnboardingChecklistClient({
  tenantName, tenantSlug, plan, completedSteps: initialCompleted,
  isEnterprise, successManagerName, successManagerEmail, primaryColor,
}: Props) {
  const [completed, setCompleted] = useState<Set<string>>(new Set(initialCompleted))
  const [marking, setMarking]     = useState<string | null>(null)

  async function markDone(step: string) {
    setMarking(step)
    await fetch('/api/bank/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step }),
    })
    setCompleted(s => new Set(Array.from(s).concat(step)))
    setMarking(null)
  }

  const steps: Step[] = [
    {
      key: 'theme_configured',
      title: 'Confirm your branding',
      description: 'Your bank name, colours, and logo are set correctly in the system.',
      action: (
        <Link href="/bank/settings" className="text-xs font-medium underline hover:opacity-80" style={{ color: primaryColor }}>
          Review in Settings →
        </Link>
      ),
    },
    {
      key: 'questions_imported',
      title: 'Import or verify your question bank',
      description: 'Upload a custom CSV/Excel question bank, or confirm the default questions are suitable.',
      action: (
        <Link href="/admin/questions/import" className="text-xs font-medium underline hover:opacity-80" style={{ color: primaryColor }}>
          Go to Question Bank →
        </Link>
      ),
    },
    {
      key: 'test_diagnostic',
      title: 'Run a test diagnostic',
      description: 'Submit at least one test diagnostic using your diagnostic link to verify the end-to-end flow.',
      action: (
        <a
          href={`/diagnostic/${tenantSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium underline hover:opacity-80"
          style={{ color: primaryColor }}
        >
          Open Diagnostic Link →
        </a>
      ),
    },
    {
      key: 'team_invited',
      title: 'Invite your team',
      description: 'Add bank staff and admin users so they can access submissions and analytics.',
      action: (
        <Link href="/bank/settings" className="text-xs font-medium underline hover:opacity-80" style={{ color: primaryColor }}>
          Go to Team Settings →
        </Link>
      ),
    },
    {
      key: 'custom_domain',
      title: 'Set up custom domain',
      description: 'Point your own domain (e.g. diagnostic.mybank.com) to BizReady for a fully branded experience.',
      action: (
        <Link href="/bank/settings" className="text-xs font-medium underline hover:opacity-80" style={{ color: primaryColor }}>
          Configure in Branding →
        </Link>
      ),
      enterpriseOnly: false,
    },
  ]

  const visibleSteps = steps.filter(s => !s.enterpriseOnly || isEnterprise)
  const completedCount = visibleSteps.filter(s => completed.has(s.key)).length
  const totalCount     = visibleSteps.length
  const allDone        = completedCount === totalCount
  const progressPct    = Math.round((completedCount / totalCount) * 100)

  return (
    <div className="p-8 max-w-3xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold"
            style={{ background: primaryColor }}
          >
            {tenantName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Welcome to BizReady, {tenantName}</h1>
            <p className="text-sm text-gray-500 capitalize">{plan} plan</p>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-3">
          Complete the steps below to get your platform fully operational. Each step takes just a few minutes.
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-8 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-gray-900">Setup progress</span>
          <span className="text-sm font-bold" style={{ color: allDone ? '#0F6E56' : primaryColor }}>
            {completedCount} / {totalCount} complete
          </span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%`, background: allDone ? '#0F6E56' : primaryColor }}
          />
        </div>
        {allDone && (
          <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-sm text-emerald-700 font-medium">
            🎉 All set! Your BizReady platform is fully configured and ready to use.
          </div>
        )}
      </div>

      {/* Steps */}
      <div className="space-y-3 mb-8">
        {visibleSteps.map((step, i) => {
          const isDone = completed.has(step.key)
          return (
            <div
              key={step.key}
              className={[
                'bg-white rounded-xl border shadow-sm p-5 flex items-start gap-4 transition-all',
                isDone ? 'border-emerald-200' : 'border-gray-100',
              ].join(' ')}
            >
              {/* Step number / check */}
              <div
                className={[
                  'w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold',
                  isDone ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400',
                ].join(' ')}
              >
                {isDone ? '✓' : i + 1}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className={['text-sm font-semibold', isDone ? 'text-emerald-700 line-through' : 'text-gray-900'].join(' ')}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                    {!isDone && <div className="mt-2">{step.action}</div>}
                  </div>
                  {!isDone && (
                    <button
                      onClick={() => markDone(step.key)}
                      disabled={marking === step.key}
                      className="flex-shrink-0 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      {marking === step.key ? '…' : 'Mark done'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Success manager card */}
      {successManagerName && (
        <div className="bg-white rounded-xl border border-violet-100 shadow-sm p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-sm flex-shrink-0">
            {successManagerName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-xs font-semibold text-violet-900 mb-0.5">Your Dedicated Success Manager</p>
            <p className="text-sm font-medium text-gray-900">{successManagerName}</p>
            <a href={`mailto:${successManagerEmail}`} className="text-xs text-violet-600 hover:underline">
              {successManagerEmail}
            </a>
            <p className="text-xs text-gray-400 mt-1">
              Your success manager is here to help you get the most from BizReady. Reach out any time.
            </p>
          </div>
        </div>
      )}

      <div className="mt-6 text-center">
        <Link
          href="/bank/dashboard"
          className="inline-block px-6 py-2.5 rounded-lg text-sm font-medium text-white shadow-sm hover:opacity-90 transition-opacity"
          style={{ background: primaryColor }}
        >
          Go to Dashboard →
        </Link>
      </div>
    </div>
  )
}
