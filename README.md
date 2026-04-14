# LendIQ — SME Lendability Diagnostic Platform
### Powered by Innovation SL · Built for UBA Sierra Leone & partner banks

A multi-tenant, white-label diagnostic platform that helps banks assess SME loan readiness using the Lendability Index — a weighted scoring system across Strategic (30%), Operational (45%), and Support (25%) capacity levels.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Auth | Clerk (multi-role, organisations) |
| Database | MongoDB Atlas (Mongoose ODM) |
| Email | Resend + React Email |
| Billing | Stripe (subscription plans) |
| Deployment | Vercel (testing) → AWS (production) |
| UI | Tailwind CSS + Radix UI + Recharts |

---

## Quick start

```bash
# 1. Clone and install
git clone https://github.com/innosl/lendiq.git
cd lendiq
npm install

# 2. Set environment variables
cp .env.local.example .env.local
# Fill in all values (Clerk, MongoDB, Resend, Stripe)

# 3. Seed the database
npm run seed

# 4. Start development server
npm run dev
```

---

## Project structure

```
src/
├── app/
│   ├── admin/          # InnoSL super-admin portal
│   ├── bank/           # Bank dashboard (per-tenant)
│   ├── sme/            # SME self-service portal
│   ├── diagnostic/     # Public diagnostic form
│   └── api/
│       ├── diagnostic/ # Form submission + scoring
│       ├── tenant/     # Tenant CRUD
│       ├── score/      # Re-score endpoint
│       ├── report/     # PDF report generation
│       └── webhook/    # Stripe + Clerk webhooks
├── components/
│   ├── ui/             # Shared UI primitives
│   ├── diagnostic/     # Form stepper components
│   ├── dashboard/      # Bank + SME dashboard charts
│   ├── funnel/         # Investment readiness funnel
│   └── theme/          # Theme provider + switcher
├── lib/
│   ├── db/             # MongoDB connection + seed
│   ├── scoring/        # Lendability scoring engine
│   ├── email/          # Resend email service
│   ├── theme/          # CSS variable injection
│   └── auth/           # Clerk helpers + role checks
├── models/             # All Mongoose schemas
├── types/              # TypeScript interfaces
└── hooks/              # React hooks
```

---

## Multi-tenancy model

Each bank is a **Tenant** with:
- A unique `slug` (e.g. `uba-sl`) used for routing and branding
- A `BankTheme` object (colours, font, logo) that cascades across all UI surfaces
- A `plan` tier controlling submission limits and feature access
- A Clerk `orgId` scoping all bank staff users

SMEs are scoped to a tenant. All MongoDB queries include `{ tenantId }` for data isolation.

---

## Subscription plans

| Plan | Price | Submissions | Features |
|---|---|---|---|
| Starter | $299/mo | 50/month | Basic dashboard, email results |
| Growth | $899/mo | Unlimited | White-label, analytics, TA tracker, PDF reports |
| Enterprise | $2,500/mo | Unlimited | Multi-country, API access, custom scoring weights |

---

## Scoring formula

```
Lendability Index = (Strategic × 30%) + (Operational × 45%) + (Support × 25%)

≥ 80%  →  Investment Ready      (proceed with standard credit appraisal)
60–79% →  Conditionally Lendable (conditional lending + TA support plan)
< 60%  →  High Risk              (incubation programme before credit)
```

---

## Deploying to Vercel

```bash
npm i -g vercel
vercel --prod
```

Set all environment variables in the Vercel dashboard before deploying.

For production (AWS): use AWS App Runner or ECS with the included `Dockerfile` (to be added).

---

## Next steps after initial deployment

1. Configure Clerk organisations for each bank tenant
2. Add bank tenants via the admin panel at `/admin/tenants`
3. Run `npm run seed` to populate the question bank
4. Configure Stripe products for the three plan tiers
5. Add the Stripe webhook URL to your Stripe dashboard: `https://yourapp.vercel.app/api/webhook/stripe`
6. Add the Clerk webhook URL: `https://yourapp.vercel.app/api/webhook/clerk`
7. Test a full diagnostic submission at `/diagnostic/uba-sl`

---

*Built by Innovation SL · InvestSalone Project · 2025*
