# COAP — Claude Code Context

## Project
Construction Operations & Accounting Platform — QuickBooks Desktop 2021 Enterprise Contractor replacement.
Repo: https://github.com/Shiru04/coap.git

## Monorepo Structure
```
coap/
├── apps/
│   ├── api/                    ← NestJS + Fastify (backend, Render)
│   │   └── src/
│   │       ├── modules/        ← One folder per feature module
│   │       ├── common/         ← Guards, interceptors, decorators, pipes
│   │       ├── config/         ← App configuration
│   │       └── main.ts
│   ├── web/                    ← Next.js 15 (frontend, Vercel)
│   └── desktop/                ← Electron (Windows offline app)
└── packages/
    ├── database/
    │   ├── prisma/schema.prisma ← MASTER SCHEMA — source of truth
    │   └── src/index.ts         ← Prisma client singleton
    ├── shared/
    │   └── src/constants/       ← Platform constants, COA defaults
    ├── ui/                      ← Shared shadcn/ui components
    └── sync/                    ← Electric SQL config
```

## Tech Stack
- **API**: NestJS 10, Fastify, TypeScript
- **Web**: Next.js 15, TailwindCSS, shadcn/ui, TanStack Query, React Hook Form + Zod
- **Database**: Prisma ORM — PostgreSQL (cloud) + SQLite (offline/Electron)
- **Auth**: Clerk
- **File Storage**: Cloudflare R2
- **Offline Sync**: Electric SQL (SQLite ↔ PostgreSQL)
- **Desktop**: Electron (Windows only, contextIsolation: true)
- **Monorepo**: Turborepo
- **Hosting**: Vercel (web) + Render (api) + Neon (PostgreSQL)
- **AI**: Anthropic Claude API (isolated AI module)

## Module List (build in this order)
1.  Core Accounting     — COA, GL, Journal Entries, Fiscal Year, Period Locking
2.  AR                  — Customers, Estimates, Progress Invoicing, Retainage, Payments
3.  AP                  — Vendors, Bills, Payments, AP Aging
4.  Banking             — Bank accounts, AMEX feed, Transaction review, Reconciliation
5.  Job Costing         — Projects, Phases, Cost Codes, WIP, Budgets
6.  Estimates & COs     — Estimate builder, Change Orders, Approval workflow
7.  Payroll             — Employees, Gross-to-net, GL posting, Certified Payroll
8.  Time Tracking       — Portal, Job/Phase/CostCode, Approvals, Payroll link
9.  Inventory           — Materials catalog, Job usage, Returns
10. Kanban & Tasks      — Board, Cards, Checklists, Calendar
11. Daily Logs          — Field logs, Photos, Documents
12. Vendor Portal       — Subcontractor invoice submission, AP integration
13. Reports             — Full QB parity + construction-specific reports
14. AI Module           — Blueprint analysis, Proposal generation (.docx)
15. Migration Tool      — QB Desktop IIF/CSV/QBB import + reconciliation

## NestJS Module Structure (follow this for every module)
```
apps/api/src/modules/{module-name}/
├── {module-name}.module.ts
├── {module-name}.controller.ts
├── {module-name}.service.ts
├── dto/
│   ├── create-{entity}.dto.ts
│   ├── update-{entity}.dto.ts
│   └── query-{entity}.dto.ts
├── entities/
│   └── {entity}.entity.ts      ← mirrors Prisma model
└── {module-name}.spec.ts       ← Jest tests
```

## Architectural Rules — NEVER VIOLATE THESE

### 1. company_id on everything
Every database query MUST filter by company_id. No exceptions.
```typescript
// CORRECT
await db.invoice.findMany({ where: { company_id: ctx.companyId } })

// WRONG — never do this
await db.invoice.findMany()
```

### 2. Immutable accounting
Posted journal entries cannot be modified. Corrections = reversing entries only.
```typescript
// Before any update, check:
if (entry.status === 'POSTED') {
  throw new ForbiddenException('Posted entries cannot be modified. Use a reversing entry.')
}
```

### 3. Period locking — enforced at service level
```typescript
// Before writing any transaction:
const period = await this.getPeriodForDate(date, companyId)
if (period?.is_closed) {
  throw new ForbiddenException(`Period ${period.name} is closed.`)
}
```

### 4. Double-entry always balances
Every journal entry must have debits === credits.
```typescript
const totalDebits = lines.reduce((sum, l) => sum.plus(l.debit), new Decimal(0))
const totalCredits = lines.reduce((sum, l) => sum.plus(l.credit), new Decimal(0))
if (!totalDebits.equals(totalCredits)) {
  throw new BadRequestException('Journal entry is not balanced.')
}
```

### 5. Decimal — never floats for money
```typescript
import Decimal from 'decimal.js'
// CORRECT
const total = new Decimal(lineAmount).plus(new Decimal(tax))
// WRONG
const total = lineAmount + tax  // floating point errors in accounting = disaster
```

### 6. CompanySettings drives behavior
```typescript
// CORRECT — check settings before applying feature logic
const settings = await this.settingsService.get(companyId)
if (settings.retainage_ar_enabled) { ... }

// WRONG — never hardcode feature behavior
if (true) { applyRetainage() }
```

### 7. Audit log on every financial state change
```typescript
await this.auditService.log({
  company_id: companyId,
  user_id: userId,
  action: 'POST',
  entity_type: 'INVOICE',
  entity_id: invoice.id,
  before: previousState,
  after: newState,
})
```

## Common Module Pattern
Every module follows this pattern:

```typescript
// module.ts
@Module({
  controllers: [AccountingController],
  providers: [AccountingService, AuditService],
  exports: [AccountingService],
})
export class AccountingModule {}

// controller.ts — always use guards
@Controller('accounting')
@UseGuards(ClerkAuthGuard)
@ApiTags('accounting')
export class AccountingController {
  constructor(private readonly service: AccountingService) {}
}

// service.ts — always extract companyId from context
@Injectable()
export class AccountingService {
  constructor(private readonly db: PrismaService) {}

  async findAll(companyId: string) {
    return this.db.account.findMany({
      where: { company_id: companyId },
    })
  }
}
```

## DTOs — always use class-validator
```typescript
import { IsString, IsEnum, IsOptional, IsDecimal } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class CreateInvoiceDto {
  @ApiProperty()
  @IsString()
  customer_id: string

  @ApiProperty({ enum: BillingMethod })
  @IsEnum(BillingMethod)
  billing_type: BillingMethod
}
```

## Error handling
```typescript
// Use NestJS built-in exceptions
throw new NotFoundException(`Invoice ${id} not found`)
throw new BadRequestException('Journal entry is not balanced')
throw new ForbiddenException('Period is closed')
throw new ConflictException('Invoice number already exists')
```

## Testing pattern
```typescript
describe('AccountingService', () => {
  // Always test:
  // 1. Happy path
  // 2. Period locked → throws ForbiddenException
  // 3. company_id isolation (cannot access other company's data)
  // 4. Double-entry balance validation
  // 5. Immutability of posted entries
})
```

## Key Constants (from packages/shared)
```typescript
import { DEFAULT_COMPANY_ID, COA_DEFAULTS } from '@coap/shared/constants'
```

## Prisma client import
```typescript
import { db } from '@coap/database'
// or inject PrismaService in NestJS DI
```

## Current Status
- ✅ Scaffolding complete
- ✅ Prisma schema complete (all models with company_id)
- ✅ AppModule with all 15 modules registered
- ✅ Electron main process
- ✅ CI/CD pipeline
- 🔄 Building: Module 1 — Core Accounting

## Agent Pipeline
After each module:
1. Code is reviewed by QA Agent (Claude.ai Project "COAP — QA")
2. Code is reviewed by Security Agent (Claude.ai Project "COAP — Security")  
3. Only after both approve → commit + push + next module
