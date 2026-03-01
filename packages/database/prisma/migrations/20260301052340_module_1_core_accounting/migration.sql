-- CreateEnum
CREATE TYPE "AccountingMethod" AS ENUM ('ACCRUAL', 'CASH');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE', 'COST_OF_GOODS_SOLD');

-- CreateEnum
CREATE TYPE "JournalEntryStatus" AS ENUM ('DRAFT', 'POSTED', 'VOIDED');

-- CreateEnum
CREATE TYPE "JournalEntryType" AS ENUM ('STANDARD', 'ADJUSTING', 'REVERSING', 'CLOSING', 'OPENING');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'ACCOUNTANT', 'PROJECT_MANAGER', 'FIELD_SUPERVISOR', 'STAFF', 'VENDOR', 'READ_ONLY');

-- CreateEnum
CREATE TYPE "VendorType" AS ENUM ('VENDOR', 'SUBCONTRACTOR', 'BOTH');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'AWARDED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BillingMethod" AS ENUM ('STANDARD', 'PROGRESS', 'AIA', 'TIME_AND_MATERIAL');

-- CreateEnum
CREATE TYPE "EstimateStatus" AS ENUM ('DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ChangeOrderStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'VOID');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PARTIAL', 'PAID', 'OVERDUE', 'VOID');

-- CreateEnum
CREATE TYPE "BillStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'PARTIAL', 'PAID', 'VOID');

-- CreateEnum
CREATE TYPE "BillSource" AS ENUM ('MANUAL', 'VENDOR_PORTAL', 'BANK_FEED', 'PO_RECEIPT');

-- CreateEnum
CREATE TYPE "POStatus" AS ENUM ('OPEN', 'PARTIAL', 'RECEIVED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SubcontractStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CHECK', 'ACH', 'WIRE', 'CREDIT_CARD', 'CASH', 'OTHER');

-- CreateEnum
CREATE TYPE "BankAccountType" AS ENUM ('CHECKING', 'SAVINGS', 'CREDIT_CARD', 'LINE_OF_CREDIT');

-- CreateEnum
CREATE TYPE "BankTransactionType" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "BankTransactionStatus" AS ENUM ('FOR_REVIEW', 'MATCHED', 'EXCLUDED', 'POSTED');

-- CreateEnum
CREATE TYPE "ReconciliationStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'TERMINATED');

-- CreateEnum
CREATE TYPE "PayType" AS ENUM ('HOURLY', 'SALARY', 'CONTRACT');

-- CreateEnum
CREATE TYPE "PaySchedule" AS ENUM ('WEEKLY', 'BIWEEKLY', 'SEMIMONTHLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "TimesheetStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'LOCKED');

-- CreateEnum
CREATE TYPE "PayrollStatus" AS ENUM ('DRAFT', 'PROCESSING', 'COMPLETED', 'VOID');

-- CreateEnum
CREATE TYPE "CostCategory" AS ENUM ('LABOR', 'MATERIALS', 'EQUIPMENT', 'SUBCONTRACT', 'OVERHEAD', 'OTHER');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "VendorInvoiceStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PAID');

-- CreateEnum
CREATE TYPE "AIJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "AIJobType" AS ENUM ('BLUEPRINT_ANALYSIS', 'PROPOSAL_GENERATION');

-- CreateEnum
CREATE TYPE "MigrationStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'ROLLED_BACK');

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legal_name" TEXT,
    "ein" TEXT,
    "address" JSONB,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "logo_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_settings" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "accounting_method" "AccountingMethod" NOT NULL DEFAULT 'ACCRUAL',
    "fiscal_year_start_month" INTEGER NOT NULL DEFAULT 1,
    "default_currency" TEXT NOT NULL DEFAULT 'USD',
    "invoice_prefix" TEXT NOT NULL DEFAULT 'INV',
    "bill_prefix" TEXT NOT NULL DEFAULT 'BILL',
    "estimate_prefix" TEXT NOT NULL DEFAULT 'EST',
    "po_prefix" TEXT NOT NULL DEFAULT 'PO',
    "journal_entry_prefix" TEXT NOT NULL DEFAULT 'JE',
    "require_approval_before_posting" BOOLEAN NOT NULL DEFAULT false,
    "retainage_ar_enabled" BOOLEAN NOT NULL DEFAULT true,
    "retainage_ap_enabled" BOOLEAN NOT NULL DEFAULT true,
    "default_retainage_pct" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "progress_invoicing_enabled" BOOLEAN NOT NULL DEFAULT true,
    "aia_billing_enabled" BOOLEAN NOT NULL DEFAULT true,
    "certified_payroll_enabled" BOOLEAN NOT NULL DEFAULT false,
    "multi_state_payroll" BOOLEAN NOT NULL DEFAULT false,
    "workers_comp_tracking" BOOLEAN NOT NULL DEFAULT true,
    "kanban_job_costing_link" BOOLEAN NOT NULL DEFAULT false,
    "amex_feed_enabled" BOOLEAN NOT NULL DEFAULT false,
    "plaid_enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "clerk_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'STAFF',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiscal_years" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "is_closed" BOOLEAN NOT NULL DEFAULT false,
    "closed_at" TIMESTAMP(3),
    "closed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fiscal_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounting_periods" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "fiscal_year_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "period_number" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "is_closed" BOOLEAN NOT NULL DEFAULT false,
    "closed_at" TIMESTAMP(3),
    "closed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accounting_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AccountType" NOT NULL,
    "sub_type" TEXT,
    "parent_id" TEXT,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "opening_balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "period_id" TEXT,
    "entry_number" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "JournalEntryStatus" NOT NULL DEFAULT 'DRAFT',
    "type" "JournalEntryType" NOT NULL DEFAULT 'STANDARD',
    "memo" TEXT,
    "reference" TEXT,
    "is_adjusting" BOOLEAN NOT NULL DEFAULT false,
    "is_reversing" BOOLEAN NOT NULL DEFAULT false,
    "reverses_id" TEXT,
    "source_type" TEXT,
    "source_id" TEXT,
    "posted_at" TIMESTAMP(3),
    "posted_by" TEXT,
    "voided_at" TIMESTAMP(3),
    "voided_by" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entry_lines" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "journal_entry_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "debit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "credit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "memo" TEXT,
    "job_id" TEXT,
    "phase_id" TEXT,
    "cost_code_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_entry_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" JSONB,
    "tax_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "credit_limit" DECIMAL(15,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendors" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" JSONB,
    "tax_id" TEXT,
    "vendor_type" "VendorType" NOT NULL DEFAULT 'VENDOR',
    "is_1099" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "coi_expiry" TIMESTAMP(3),
    "license_expiry" TIMESTAMP(3),
    "portal_email" TEXT,
    "portal_enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "job_number" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "type" TEXT,
    "start_date" TIMESTAMP(3),
    "projected_end" TIMESTAMP(3),
    "actual_end" TIMESTAMP(3),
    "contract_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "original_contract" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "retainage_pct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "billing_method" "BillingMethod" NOT NULL DEFAULT 'PROGRESS',
    "address" JSONB,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_phases" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_phases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_codes" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "CostCategory" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cost_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_budgets" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "phase_id" TEXT,
    "cost_code_id" TEXT,
    "original_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "revised_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estimates" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "estimate_number" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "job_id" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "expiry_date" TIMESTAMP(3),
    "status" "EstimateStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT,
    "notes" TEXT,
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estimates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estimate_lines" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "estimate_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unit" TEXT,
    "unit_cost" DECIMAL(15,2) NOT NULL,
    "markup_pct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL,
    "cost_code_id" TEXT,
    "phase_id" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "estimate_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "change_orders" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "estimate_id" TEXT,
    "co_number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ChangeOrderStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(15,2) NOT NULL,
    "approved_at" TIMESTAMP(3),
    "approved_by" TEXT,
    "rejected_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "change_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "job_id" TEXT,
    "estimate_id" TEXT,
    "period_id" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3),
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "billing_type" "BillingMethod" NOT NULL DEFAULT 'STANDARD',
    "application_number" INTEGER,
    "period_from" TIMESTAMP(3),
    "period_to" TIMESTAMP(3),
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "retainage_pct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "retainage_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "amount_paid" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "balance_due" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_lines" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unit_price" DECIMAL(15,2) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "phase_id" TEXT,
    "cost_code_id" TEXT,
    "pct_complete" DECIMAL(5,2),
    "is_billable" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_payments" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "reference" TEXT,
    "memo" TEXT,
    "bank_account_id" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_applications" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bills" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "bill_number" TEXT,
    "vendor_id" TEXT NOT NULL,
    "po_id" TEXT,
    "period_id" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3),
    "status" "BillStatus" NOT NULL DEFAULT 'DRAFT',
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "retainage_pct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "retainage_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "amount_paid" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "balance_due" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "memo" TEXT,
    "source" "BillSource" NOT NULL DEFAULT 'MANUAL',
    "vendor_portal_invoice_id" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_lines" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "bill_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unit_price" DECIMAL(15,2) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "account_id" TEXT,
    "job_id" TEXT,
    "phase_id" TEXT,
    "cost_code_id" TEXT,
    "is_billable" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bill_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_payments" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "reference" TEXT,
    "memo" TEXT,
    "bank_account_id" TEXT,
    "is_1099_eligible" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_payment_applications" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "bill_id" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_payment_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "po_number" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "job_id" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "expected_date" TIMESTAMP(3),
    "status" "POStatus" NOT NULL DEFAULT 'OPEN',
    "total" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "received" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "memo" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order_lines" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "po_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unit_price" DECIMAL(15,2) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "received_qty" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "cost_code_id" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_order_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subcontracts" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "contract_number" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(15,2) NOT NULL,
    "status" "SubcontractStatus" NOT NULL DEFAULT 'ACTIVE',
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subcontracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_accounts" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "account_type" "BankAccountType" NOT NULL,
    "institution" TEXT,
    "last_four" TEXT,
    "routing_number" TEXT,
    "current_balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "gl_account_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "plaid_account_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_transactions" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "bank_account_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "type" "BankTransactionType" NOT NULL,
    "status" "BankTransactionStatus" NOT NULL DEFAULT 'FOR_REVIEW',
    "reference" TEXT,
    "merchant" TEXT,
    "matched_type" TEXT,
    "matched_id" TEXT,
    "account_id" TEXT,
    "job_id" TEXT,
    "phase_id" TEXT,
    "cost_code_id" TEXT,
    "memo" TEXT,
    "rule_id" TEXT,
    "source" TEXT NOT NULL DEFAULT 'IMPORT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_rules" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "merchant_contains" TEXT,
    "description_contains" TEXT,
    "amount_equals" DECIMAL(15,2),
    "account_id" TEXT,
    "job_id" TEXT,
    "cost_code_id" TEXT,
    "vendor_id" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_reconciliations" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "bank_account_id" TEXT NOT NULL,
    "statement_date" TIMESTAMP(3) NOT NULL,
    "statement_balance" DECIMAL(15,2) NOT NULL,
    "cleared_balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "difference" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" "ReconciliationStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "completed_at" TIMESTAMP(3),
    "completed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_reconciliations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "ssn_last_four" TEXT,
    "address" JSONB,
    "hire_date" TIMESTAMP(3),
    "termination_date" TIMESTAMP(3),
    "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "pay_type" "PayType" NOT NULL DEFAULT 'HOURLY',
    "pay_rate" DECIMAL(10,2) NOT NULL,
    "overtime_rate" DECIMAL(10,2),
    "pay_schedule" "PaySchedule" NOT NULL DEFAULT 'WEEKLY',
    "department" TEXT,
    "workers_comp_code" TEXT,
    "federal_filing" JSONB,
    "state_filings" JSONB,
    "direct_deposit" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timesheets" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "week_start" TIMESTAMP(3) NOT NULL,
    "status" "TimesheetStatus" NOT NULL DEFAULT 'DRAFT',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "total_hours" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timesheets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timesheet_lines" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "timesheet_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "job_id" TEXT,
    "phase_id" TEXT,
    "cost_code_id" TEXT,
    "kanban_card_id" TEXT,
    "hours" DECIMAL(8,2) NOT NULL,
    "overtime_hours" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "is_billable" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "timesheet_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_runs" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "pay_date" TIMESTAMP(3) NOT NULL,
    "status" "PayrollStatus" NOT NULL DEFAULT 'DRAFT',
    "total_gross" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_taxes" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_net" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_items" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "payroll_run_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "regular_hours" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "overtime_hours" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "gross_pay" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "federal_tax" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "state_tax" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "social_security" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "medicare" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "other_deductions" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "net_pay" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "job_allocations" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payroll_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kanban_boards" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "job_id" TEXT,
    "name" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kanban_boards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kanban_columns" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "board_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "wip_limit" INTEGER,
    "color" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kanban_columns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kanban_cards" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "column_id" TEXT NOT NULL,
    "job_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "due_date" TIMESTAMP(3),
    "assigned_to" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "estimated_hours" DECIMAL(8,2),
    "cost_code_id" TEXT,
    "is_billable" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kanban_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kanban_checklists" (
    "id" TEXT NOT NULL,
    "card_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "is_done" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kanban_checklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_logs" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "weather" TEXT,
    "temperature" TEXT,
    "crew_count" INTEGER,
    "work_performed" TEXT,
    "issues" TEXT,
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_size" INTEGER,
    "mime_type" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "is_blueprint" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_portal_invoices" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "job_id" TEXT,
    "invoice_number" TEXT NOT NULL,
    "invoice_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3),
    "amount" DECIMAL(15,2) NOT NULL,
    "retainage_pct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "retainage_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" "VendorInvoiceStatus" NOT NULL DEFAULT 'SUBMITTED',
    "file_url" TEXT,
    "notes" TEXT,
    "rejection_reason" TEXT,
    "bill_id" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_portal_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_portal_invoice_lines" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,3),
    "unit_price" DECIMAL(15,2),
    "amount" DECIMAL(15,2) NOT NULL,
    "phase_id" TEXT,
    "cost_code_id" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_portal_invoice_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_analysis_jobs" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "job_id" TEXT,
    "document_id" TEXT,
    "status" "AIJobStatus" NOT NULL DEFAULT 'PENDING',
    "type" "AIJobType" NOT NULL DEFAULT 'BLUEPRINT_ANALYSIS',
    "input_file_url" TEXT,
    "extracted_data" JSONB,
    "material_quantities" JSONB,
    "calculated_cost" DECIMAL(15,2),
    "proposal_url" TEXT,
    "error_message" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_analysis_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_price_tables" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "unit_price" DECIMAL(15,2) NOT NULL,
    "category" TEXT,
    "markup_pct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "material_price_tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "migration_runs" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "source_format" TEXT NOT NULL,
    "status" "MigrationStatus" NOT NULL DEFAULT 'PENDING',
    "total_records" INTEGER NOT NULL DEFAULT 0,
    "processed" INTEGER NOT NULL DEFAULT 0,
    "errors" INTEGER NOT NULL DEFAULT 0,
    "log" JSONB,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "migration_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "company_settings_company_id_key" ON "company_settings"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_clerk_id_key" ON "users"("clerk_id");

-- CreateIndex
CREATE INDEX "users_company_id_idx" ON "users"("company_id");

-- CreateIndex
CREATE INDEX "fiscal_years_company_id_idx" ON "fiscal_years"("company_id");

-- CreateIndex
CREATE INDEX "accounting_periods_company_id_idx" ON "accounting_periods"("company_id");

-- CreateIndex
CREATE INDEX "accounts_company_id_idx" ON "accounts"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_company_id_code_key" ON "accounts"("company_id", "code");

-- CreateIndex
CREATE INDEX "journal_entries_company_id_idx" ON "journal_entries"("company_id");

-- CreateIndex
CREATE INDEX "journal_entries_company_id_date_idx" ON "journal_entries"("company_id", "date");

-- CreateIndex
CREATE INDEX "journal_entries_company_id_status_idx" ON "journal_entries"("company_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "journal_entries_company_id_entry_number_key" ON "journal_entries"("company_id", "entry_number");

-- CreateIndex
CREATE INDEX "journal_entry_lines_company_id_idx" ON "journal_entry_lines"("company_id");

-- CreateIndex
CREATE INDEX "journal_entry_lines_journal_entry_id_idx" ON "journal_entry_lines"("journal_entry_id");

-- CreateIndex
CREATE INDEX "customers_company_id_idx" ON "customers"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "vendors_portal_email_key" ON "vendors"("portal_email");

-- CreateIndex
CREATE INDEX "vendors_company_id_idx" ON "vendors"("company_id");

-- CreateIndex
CREATE INDEX "jobs_company_id_idx" ON "jobs"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "jobs_company_id_job_number_key" ON "jobs"("company_id", "job_number");

-- CreateIndex
CREATE INDEX "job_phases_company_id_job_id_idx" ON "job_phases"("company_id", "job_id");

-- CreateIndex
CREATE INDEX "cost_codes_company_id_idx" ON "cost_codes"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "cost_codes_company_id_code_key" ON "cost_codes"("company_id", "code");

-- CreateIndex
CREATE INDEX "job_budgets_company_id_job_id_idx" ON "job_budgets"("company_id", "job_id");

-- CreateIndex
CREATE INDEX "estimates_company_id_idx" ON "estimates"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "estimates_company_id_estimate_number_key" ON "estimates"("company_id", "estimate_number");

-- CreateIndex
CREATE INDEX "estimate_lines_estimate_id_idx" ON "estimate_lines"("estimate_id");

-- CreateIndex
CREATE INDEX "change_orders_company_id_job_id_idx" ON "change_orders"("company_id", "job_id");

-- CreateIndex
CREATE UNIQUE INDEX "change_orders_company_id_co_number_key" ON "change_orders"("company_id", "co_number");

-- CreateIndex
CREATE INDEX "invoices_company_id_idx" ON "invoices"("company_id");

-- CreateIndex
CREATE INDEX "invoices_company_id_customer_id_idx" ON "invoices"("company_id", "customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_company_id_invoice_number_key" ON "invoices"("company_id", "invoice_number");

-- CreateIndex
CREATE INDEX "invoice_lines_invoice_id_idx" ON "invoice_lines"("invoice_id");

-- CreateIndex
CREATE INDEX "customer_payments_company_id_idx" ON "customer_payments"("company_id");

-- CreateIndex
CREATE INDEX "payment_applications_company_id_idx" ON "payment_applications"("company_id");

-- CreateIndex
CREATE INDEX "bills_company_id_idx" ON "bills"("company_id");

-- CreateIndex
CREATE INDEX "bills_company_id_vendor_id_idx" ON "bills"("company_id", "vendor_id");

-- CreateIndex
CREATE INDEX "bill_lines_bill_id_idx" ON "bill_lines"("bill_id");

-- CreateIndex
CREATE INDEX "vendor_payments_company_id_idx" ON "vendor_payments"("company_id");

-- CreateIndex
CREATE INDEX "vendor_payment_applications_company_id_idx" ON "vendor_payment_applications"("company_id");

-- CreateIndex
CREATE INDEX "purchase_orders_company_id_idx" ON "purchase_orders"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_company_id_po_number_key" ON "purchase_orders"("company_id", "po_number");

-- CreateIndex
CREATE INDEX "purchase_order_lines_po_id_idx" ON "purchase_order_lines"("po_id");

-- CreateIndex
CREATE INDEX "subcontracts_company_id_idx" ON "subcontracts"("company_id");

-- CreateIndex
CREATE INDEX "bank_accounts_company_id_idx" ON "bank_accounts"("company_id");

-- CreateIndex
CREATE INDEX "bank_transactions_company_id_idx" ON "bank_transactions"("company_id");

-- CreateIndex
CREATE INDEX "bank_transactions_company_id_bank_account_id_idx" ON "bank_transactions"("company_id", "bank_account_id");

-- CreateIndex
CREATE INDEX "bank_rules_company_id_idx" ON "bank_rules"("company_id");

-- CreateIndex
CREATE INDEX "bank_reconciliations_company_id_idx" ON "bank_reconciliations"("company_id");

-- CreateIndex
CREATE INDEX "employees_company_id_idx" ON "employees"("company_id");

-- CreateIndex
CREATE INDEX "timesheets_company_id_idx" ON "timesheets"("company_id");

-- CreateIndex
CREATE INDEX "timesheet_lines_timesheet_id_idx" ON "timesheet_lines"("timesheet_id");

-- CreateIndex
CREATE INDEX "payroll_runs_company_id_idx" ON "payroll_runs"("company_id");

-- CreateIndex
CREATE INDEX "payroll_items_company_id_idx" ON "payroll_items"("company_id");

-- CreateIndex
CREATE INDEX "kanban_boards_company_id_idx" ON "kanban_boards"("company_id");

-- CreateIndex
CREATE INDEX "kanban_columns_board_id_idx" ON "kanban_columns"("board_id");

-- CreateIndex
CREATE INDEX "kanban_cards_company_id_idx" ON "kanban_cards"("company_id");

-- CreateIndex
CREATE INDEX "kanban_checklists_card_id_idx" ON "kanban_checklists"("card_id");

-- CreateIndex
CREATE INDEX "daily_logs_company_id_job_id_idx" ON "daily_logs"("company_id", "job_id");

-- CreateIndex
CREATE INDEX "documents_company_id_idx" ON "documents"("company_id");

-- CreateIndex
CREATE INDEX "documents_entity_type_entity_id_idx" ON "documents"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "vendor_portal_invoices_company_id_idx" ON "vendor_portal_invoices"("company_id");

-- CreateIndex
CREATE INDEX "vendor_portal_invoice_lines_invoice_id_idx" ON "vendor_portal_invoice_lines"("invoice_id");

-- CreateIndex
CREATE INDEX "ai_analysis_jobs_company_id_idx" ON "ai_analysis_jobs"("company_id");

-- CreateIndex
CREATE INDEX "material_price_tables_company_id_idx" ON "material_price_tables"("company_id");

-- CreateIndex
CREATE INDEX "migration_runs_company_id_idx" ON "migration_runs"("company_id");

-- CreateIndex
CREATE INDEX "audit_logs_company_id_idx" ON "audit_logs"("company_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- AddForeignKey
ALTER TABLE "company_settings" ADD CONSTRAINT "company_settings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_years" ADD CONSTRAINT "fiscal_years_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_periods" ADD CONSTRAINT "accounting_periods_fiscal_year_id_fkey" FOREIGN KEY ("fiscal_year_id") REFERENCES "fiscal_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "accounting_periods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "job_phases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_cost_code_id_fkey" FOREIGN KEY ("cost_code_id") REFERENCES "cost_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_phases" ADD CONSTRAINT "job_phases_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_budgets" ADD CONSTRAINT "job_budgets_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_budgets" ADD CONSTRAINT "job_budgets_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "job_phases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_budgets" ADD CONSTRAINT "job_budgets_cost_code_id_fkey" FOREIGN KEY ("cost_code_id") REFERENCES "cost_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimate_lines" ADD CONSTRAINT "estimate_lines_estimate_id_fkey" FOREIGN KEY ("estimate_id") REFERENCES "estimates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_orders" ADD CONSTRAINT "change_orders_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_orders" ADD CONSTRAINT "change_orders_estimate_id_fkey" FOREIGN KEY ("estimate_id") REFERENCES "estimates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_estimate_id_fkey" FOREIGN KEY ("estimate_id") REFERENCES "estimates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "job_phases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_cost_code_id_fkey" FOREIGN KEY ("cost_code_id") REFERENCES "cost_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_applications" ADD CONSTRAINT "payment_applications_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "customer_payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_applications" ADD CONSTRAINT "payment_applications_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_po_id_fkey" FOREIGN KEY ("po_id") REFERENCES "purchase_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_lines" ADD CONSTRAINT "bill_lines_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "bills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_lines" ADD CONSTRAINT "bill_lines_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "job_phases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_lines" ADD CONSTRAINT "bill_lines_cost_code_id_fkey" FOREIGN KEY ("cost_code_id") REFERENCES "cost_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_payments" ADD CONSTRAINT "vendor_payments_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_payment_applications" ADD CONSTRAINT "vendor_payment_applications_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "vendor_payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_payment_applications" ADD CONSTRAINT "vendor_payment_applications_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "bills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_lines" ADD CONSTRAINT "purchase_order_lines_po_id_fkey" FOREIGN KEY ("po_id") REFERENCES "purchase_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcontracts" ADD CONSTRAINT "subcontracts_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcontracts" ADD CONSTRAINT "subcontracts_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_reconciliations" ADD CONSTRAINT "bank_reconciliations_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timesheet_lines" ADD CONSTRAINT "timesheet_lines_timesheet_id_fkey" FOREIGN KEY ("timesheet_id") REFERENCES "timesheets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timesheet_lines" ADD CONSTRAINT "timesheet_lines_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "job_phases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timesheet_lines" ADD CONSTRAINT "timesheet_lines_cost_code_id_fkey" FOREIGN KEY ("cost_code_id") REFERENCES "cost_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timesheet_lines" ADD CONSTRAINT "timesheet_lines_kanban_card_id_fkey" FOREIGN KEY ("kanban_card_id") REFERENCES "kanban_cards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_items" ADD CONSTRAINT "payroll_items_payroll_run_id_fkey" FOREIGN KEY ("payroll_run_id") REFERENCES "payroll_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_items" ADD CONSTRAINT "payroll_items_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kanban_columns" ADD CONSTRAINT "kanban_columns_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "kanban_boards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kanban_cards" ADD CONSTRAINT "kanban_cards_column_id_fkey" FOREIGN KEY ("column_id") REFERENCES "kanban_columns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kanban_cards" ADD CONSTRAINT "kanban_cards_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kanban_checklists" ADD CONSTRAINT "kanban_checklists_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "kanban_cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_logs" ADD CONSTRAINT "daily_logs_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "doc_job_fk" FOREIGN KEY ("entity_id") REFERENCES "jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "doc_kanban_fk" FOREIGN KEY ("entity_id") REFERENCES "kanban_cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "doc_daily_log_fk" FOREIGN KEY ("entity_id") REFERENCES "daily_logs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_portal_invoices" ADD CONSTRAINT "vendor_portal_invoices_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_portal_invoice_lines" ADD CONSTRAINT "vendor_portal_invoice_lines_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "vendor_portal_invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
