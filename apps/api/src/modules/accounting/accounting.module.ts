import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

// Guards
import { CompanyGuard } from './guards/company.guard';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';

// Controllers
import { AccountsController } from './controllers/accounts.controller';
import { JournalEntriesController } from './controllers/journal-entries.controller';
import { FiscalYearsController } from './controllers/fiscal-years.controller';
import { PeriodsController } from './controllers/periods.controller';

// Services
import { AccountsService } from './services/accounts.service';
import { JournalEntriesService } from './services/journal-entries.service';
import { GlEngineService } from './services/gl-engine.service';
import { FiscalYearsService } from './services/fiscal-years.service';
import { PeriodsService } from './services/periods.service';
import { AuditService } from './services/audit.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-secret',
    }),
  ],
  controllers: [
    AccountsController,
    JournalEntriesController,
    FiscalYearsController,
    PeriodsController,
  ],
  providers: [
    // Guards
    ClerkAuthGuard,
    CompanyGuard,
    // Services
    AccountsService,
    JournalEntriesService,
    GlEngineService,
    FiscalYearsService,
    PeriodsService,
    AuditService,
  ],
  exports: [
    GlEngineService,   // Exported for AR, AP, Payroll to post GL entries
    AuditService,      // Exported for other modules to audit log
    AccountsService,   // Exported for COA lookups
  ],
})
export class AccountingModule {}
