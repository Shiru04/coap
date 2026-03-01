// =============================================================================
// COAP Platform Constants
// =============================================================================

// Single company ID for now — replace with dynamic tenant ID when going multi-tenant
export const DEFAULT_COMPANY_ID = process.env.DEFAULT_COMPANY_ID ?? "coap-default-company";

// Accounting
export const DECIMAL_PRECISION = 2;
export const QUANTITY_PRECISION = 3;

// Retainage defaults
export const DEFAULT_RETAINAGE_PCT = 10;

// Aging buckets (days)
export const AGING_BUCKETS = [0, 30, 60, 90, 120] as const;

// Date formats
export const DATE_FORMAT = "MM/DD/YYYY";
export const DATETIME_FORMAT = "MM/DD/YYYY HH:mm";

// File limits
export const MAX_FILE_SIZE_MB = 50;
export const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
] as const;

// Pagination
export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

// QB Migration supported formats
export const QB_MIGRATION_FORMATS = ["IIF", "CSV", "QBB"] as const;

// Default Contractor Chart of Accounts codes
export const COA_DEFAULTS = {
  CHECKING: "1010",
  ACCOUNTS_RECEIVABLE: "1200",
  RETAINAGE_RECEIVABLE: "1210",
  COSTS_IN_EXCESS: "1220",     // Under-billed (WIP Asset)
  MATERIALS_INVENTORY: "1300",
  ACCOUNTS_PAYABLE: "2000",
  RETAINAGE_PAYABLE: "2010",
  BILLINGS_IN_EXCESS: "2020",  // Over-billed (WIP Liability)
  PAYROLL_LIABILITIES: "2100",
  CREDIT_CARD: "2200",
  RETAINED_EARNINGS: "3900",
  CONTRACT_REVENUE: "4000",
  DIRECT_LABOR: "5000",
  DIRECT_MATERIALS: "5010",
  SUBCONTRACT_COSTS: "5020",
  EQUIPMENT_COSTS: "5030",
  OVERHEAD: "6000",
} as const;
