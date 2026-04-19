# BizReady
### Powered by Innovation SL

BizReady is a multi-tenant SME investment-readiness platform for banks and support organisations. It combines a public diagnostic, scoring engine, lender dashboards, SME self-service views, TA programme tracking, and platform administration in a single Next.js application.

## Stack

- Next.js 14 App Router
- Clerk authentication
- MongoDB Atlas with Mongoose
- Resend email delivery
- Stripe billing hooks
- Tailwind CSS, Radix UI, Recharts

## Core surfaces

- `/diagnostic/[tenantSlug]`: public bank-branded diagnostic form
- `/bank/*`: lender dashboard, submissions, SME profiles, analytics, reports, settings, TA tracking
- `/sme/*`: SME progress, diagnostics history, TA programmes
- `/admin/*`: platform dashboard, tenant management, diagnostics oversight, question bank, billing
- `/api/*`: onboarding, scoring submission, bank analytics/settings/TA, question-bank import/export, Stripe webhook

## Local setup

```bash
npm install
copy .env.local.example .env.local
npm run seed
npm run dev
```

Fill `.env.local` with the required Clerk, MongoDB, Resend, Stripe, and app URL values from the example file.

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
npm run seed
```

## Environment

The project expects these groups of variables:

- Clerk: publishable key, secret key, sign-in/sign-up URLs, webhook secret
- MongoDB: `MONGODB_URI`, `DB_NAME`
- Resend: API key, from email, reply-to
- Stripe: secret key, publishable key, webhook secret, price IDs
- App: public URL, app name, platform name, `NODE_ENV`

## Project structure

```text
src/
  app/
    admin/
    bank/
    diagnostic/
    onboarding/
    sme/
    api/
  components/
    diagnostic/
    funnel/
    layout/
    theme/
    ui/
  lib/
    db/
    email/
    scoring/
    theme/
  models/
  types/
```

## Verification

The repository now includes:

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- GitHub Actions workflow at `.github/workflows/ci.yml`

## Current production status

The app is materially stronger than the original audit baseline:

- production build succeeds
- broken admin test/public test routes have been removed
- admin dashboard now uses live data
- bank settings and reports have real paths
- TA programme creation is now wired through `/api/bank/ta`
- onboarding no longer auto-promotes arbitrary users to bank admin
- the public diagnostic uses database-backed question-bank content

Remaining work before calling it production-ready still includes broader test coverage, monitoring, rate limiting, fuller documentation of deployment operations, and continued internationalisation cleanup.
