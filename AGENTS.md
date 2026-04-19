# AGENTS.md

## Purpose
This file helps AI coding agents work with the BizReady repository quickly and safely.

## Project summary
BizReady is a Next.js 14 App Router application for a multi-tenant SME investment readiness platform. It includes a public diagnostic flow, bank dashboards, SME self-service pages, platform admin surfaces, and API routes for onboarding, scoring, analytics, billing, and question-bank import/export.

## Primary commands
- `npm install`
- `npm run dev` (local development on port `3001`)
- `npm run build`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run seed`

## Key architecture
- `src/app/` contains all route segments and page/layout components.
- `src/app/api/` contains server route handlers.
- `src/components/` contains reusable UI and layout components.
- `src/lib/` contains database, email, scoring, auth, onboarding, and theme helpers.
- `src/models/` holds Mongoose models.
- `src/types/` holds shared TypeScript types.

## Core app surfaces
- `/diagnostic/[tenantSlug]` — public bank-branded diagnostic form
- `/bank/*` — lender dashboard, submissions, reports, analytics, TA tracking
- `/sme/*` — SME progress, diagnostics history, TA programmes
- `/admin/*` — platform administration, tenant/diagnostic management, billing, question bank
- `/api/*` — onboarding, diagnostic submission, bank settings/analytics/TA, question bank import/export, Stripe webhook

## Important conventions
- Maintain App Router layout structure in `src/app/`.
- Keep API route behavior aligned with existing `/api/*` routes and backend models.
- Use existing Tailwind/CSS patterns in `src/app/globals.css` and `src/components/ui`.
- Preserve the repository’s current environment expectations: Clerk, MongoDB Atlas, Resend, Stripe, and app URL settings.

## Existing documentation
- See `README.md` for setup, environment variable groups, and repo structure.

## What agents should do first
1. Read `README.md`.
2. Confirm relevant command(s) from `package.json`.
3. Examine `src/app/` route layout before changing navigation or route behavior.
4. Avoid making wide refactors without explicit user request.

## When in doubt
- Prefer small, incremental changes.
- Preserve existing route and data model contracts.
- Ask the user before altering auth, billing, or production-critical flows.
