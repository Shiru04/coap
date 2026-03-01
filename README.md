# COAP — Construction Operations & Accounting Platform

QuickBooks Desktop 2021 Enterprise Contractor replacement, built as a cloud-first + Electron offline desktop app.

## Architecture

```
coap/
├── apps/
│   ├── web/          → Next.js 15 (browser, cloud — Vercel)
│   ├── api/          → NestJS + Fastify (backend — Render)
│   └── desktop/      → Electron (Windows offline app)
│
├── packages/
│   ├── database/     → Prisma schema (PostgreSQL + SQLite)
│   ├── shared/       → Types, constants, Zod schemas
│   ├── ui/           → shadcn/ui component library
│   ├── sync/         → Electric SQL offline sync config
│   └── config/       → Shared TS/ESLint/Tailwind config
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, TailwindCSS, shadcn/ui |
| State | TanStack Query, React Hook Form + Zod |
| Backend | NestJS, Fastify |
| Database | PostgreSQL (cloud), SQLite (offline) |
| ORM | Prisma |
| Offline Sync | Electric SQL |
| Auth | Clerk |
| File Storage | Cloudflare R2 |
| Hosting (web) | Vercel |
| Hosting (api) | Render |
| Database (cloud) | Neon PostgreSQL |
| Desktop | Electron (Windows only) |
| AI | Anthropic Claude API |
| CI/CD | GitHub Actions |

## Modules

| # | Module | Description |
|---|--------|-------------|
| 1 | Core Accounting | COA, GL, Journal Entries, Fiscal Year, Period Locking |
| 2 | AR | Customers, Estimates, Progress Invoicing, Retainage |
| 3 | AP | Vendors, Bills, Payments, AP Aging |
| 4 | Banking | Bank feeds, AMEX integration, Reconciliation |
| 5 | Job Costing | Projects, Phases, Cost Codes, WIP, Budgets |
| 6 | Estimates & Change Orders | Estimates, CO workflow, Budget impact |
| 7 | Payroll | Employees, Timesheets, Gross-to-net, GL posting |
| 8 | Time Tracking | Portal, Job/Phase/CostCode tracking, Approvals |
| 9 | Inventory | Materials catalog, Job usage, Returns |
| 10 | Kanban | Project board, Tasks, Checklists |
| 11 | Daily Logs | Field logs, Photos, Documents |
| 12 | Vendor Portal | Subcontractor invoice submission, AP integration |
| 13 | AI Module | Blueprint analysis, Proposal generation |
| 14 | Reports | Full QB parity + construction-specific reports |
| 15 | Migration | QB Desktop IIF/CSV/QBB import tool |

## Key Design Decisions

### Single-tenant now, multi-tenant ready
- `company_id` on every table
- All queries filter by `company_id`
- RLS activation = flipping a switch when needed

### Offline-first Electron
- SQLite mirrors PostgreSQL schema via Prisma
- Electric SQL handles bidirectional sync
- Conflict resolution: last-write-wins (financial entries require manual resolution)

### Immutable accounting
- Posted journal entries cannot be modified
- Corrections via reversing entries only
- Full audit trail on all entities
- Period locking enforced at API level

### AI module isolation
- Lives at `apps/api/src/modules/ai/`
- Read-only database access
- Independent routes under `/api/v1/ai/*`
- Separate dev can work without touching core

## Getting Started

```bash
# Install dependencies
npm install

# Copy env files
cp apps/api/.env.example apps/api/.env.local

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Start development (all apps)
npm run dev

# Start only API
npx turbo dev --filter=@coap/api

# Start only web
npx turbo dev --filter=@coap/web
```

## Environment Variables

See `apps/api/.env.example` for all required variables.

## Deployment

- **Web**: Auto-deploys to Vercel on push to `main`
- **API**: Auto-deploys to Render on push to `main`
- **Desktop**: Build with `npm run package:win` in `apps/desktop`

## Agent Setup (Development)

This project uses a multi-agent Claude workflow:
- **Dev Agent**: Implements features module by module
- **QA Agent**: Tests each module before closure
- **Security Agent**: Audits each module for vulnerabilities
- **PM (You)**: Orchestrates and reviews

---

Built with Claude — COAP Platform
