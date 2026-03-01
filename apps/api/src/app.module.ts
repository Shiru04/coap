import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";

// Core modules
import { AuthModule } from "./modules/auth/auth.module";
import { SettingsModule } from "./modules/settings/settings.module";

// Accounting modules
import { AccountingModule } from "./modules/accounting/accounting.module";
import { ARModule } from "./modules/ar/ar.module";
import { APModule } from "./modules/ap/ap.module";
import { BankingModule } from "./modules/banking/banking.module";

// Operations modules
import { JobsModule } from "./modules/jobs/jobs.module";
import { EstimatesModule } from "./modules/estimates/estimates.module";
import { PayrollModule } from "./modules/payroll/payroll.module";
import { TimeTrackingModule } from "./modules/time-tracking/time-tracking.module";
import { InventoryModule } from "./modules/inventory/inventory.module";
import { KanbanModule } from "./modules/kanban/kanban.module";
import { DailyLogsModule } from "./modules/daily-logs/daily-logs.module";

// External modules
import { VendorPortalModule } from "./modules/vendor-portal/vendor-portal.module";
import { AIModule } from "./modules/ai/ai.module";
import { MigrationModule } from "./modules/migration/migration.module";
import { ReportsModule } from "./modules/reports/reports.module";

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Core
    AuthModule,
    SettingsModule,

    // Accounting
    AccountingModule,
    ARModule,
    APModule,
    BankingModule,

    // Operations
    JobsModule,
    EstimatesModule,
    PayrollModule,
    TimeTrackingModule,
    InventoryModule,
    KanbanModule,
    DailyLogsModule,

    // External
    VendorPortalModule,
    ReportsModule,

    // AI — isolated module, read-only access
    AIModule,

    // Migration utility
    MigrationModule,
  ],
})
export class AppModule {}
