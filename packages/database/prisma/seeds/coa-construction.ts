/**
 * COA Seed — Standard Construction Chart of Accounts
 * Safe to run multiple times (idempotent via upsert).
 * Usage: npx ts-node packages/database/prisma/seeds/coa-construction.ts
 */

import { PrismaClient, AccountType } from '@prisma/client';

const db = new PrismaClient();

const COMPANY_ID = process.env.DEFAULT_COMPANY_ID ?? 'coap-default-company';

interface AccountSeed {
  code: string;
  name: string;
  type: AccountType;
  sub_type?: string;
  description?: string;
  is_system?: boolean;
}

const COA: AccountSeed[] = [
  // ─── ASSETS (1000–1999) ──────────────────────────────────────────────────
  { code: '1000', name: 'Cash — Operating', type: AccountType.ASSET, sub_type: 'Checking', is_system: true },
  { code: '1010', name: 'Cash — Payroll', type: AccountType.ASSET, sub_type: 'Checking' },
  { code: '1100', name: 'Accounts Receivable', type: AccountType.ASSET, sub_type: 'Accounts Receivable', is_system: true },
  { code: '1150', name: 'Retainage Receivable', type: AccountType.ASSET, sub_type: 'Other Current Asset', is_system: true },
  { code: '1200', name: 'Inventory — Materials', type: AccountType.ASSET, sub_type: 'Inventory' },
  { code: '1300', name: 'Prepaid Expenses', type: AccountType.ASSET, sub_type: 'Other Current Asset' },
  { code: '1500', name: 'Equipment', type: AccountType.ASSET, sub_type: 'Fixed Asset' },
  { code: '1510', name: 'Accumulated Depreciation — Equipment', type: AccountType.ASSET, sub_type: 'Fixed Asset', description: 'Contra asset — credit balance' },
  { code: '1600', name: 'Vehicles', type: AccountType.ASSET, sub_type: 'Fixed Asset' },
  { code: '1610', name: 'Accumulated Depreciation — Vehicles', type: AccountType.ASSET, sub_type: 'Fixed Asset', description: 'Contra asset — credit balance' },

  // ─── LIABILITIES (2000–2999) ─────────────────────────────────────────────
  { code: '2000', name: 'Accounts Payable', type: AccountType.LIABILITY, sub_type: 'Accounts Payable', is_system: true },
  { code: '2050', name: 'Retainage Payable', type: AccountType.LIABILITY, sub_type: 'Other Current Liability', is_system: true },
  { code: '2100', name: 'Accrued Payroll', type: AccountType.LIABILITY, sub_type: 'Other Current Liability' },
  { code: '2200', name: 'Payroll Tax Liabilities', type: AccountType.LIABILITY, sub_type: 'Other Current Liability' },
  { code: '2300', name: 'Sales Tax Payable', type: AccountType.LIABILITY, sub_type: 'Other Current Liability' },
  { code: '2400', name: 'Credit Card — AMEX', type: AccountType.LIABILITY, sub_type: 'Credit Card' },
  { code: '2500', name: 'Line of Credit', type: AccountType.LIABILITY, sub_type: 'Line of Credit' },
  { code: '2600', name: 'Notes Payable — Equipment', type: AccountType.LIABILITY, sub_type: 'Long-Term Liability' },
  { code: '2700', name: 'Notes Payable — Vehicle', type: AccountType.LIABILITY, sub_type: 'Long-Term Liability' },

  // ─── EQUITY (3000–3999) ──────────────────────────────────────────────────
  { code: '3000', name: "Owner's Equity", type: AccountType.EQUITY, sub_type: 'Equity', is_system: true },
  { code: '3100', name: "Owner's Draw", type: AccountType.EQUITY, sub_type: 'Equity' },
  { code: '3200', name: 'Retained Earnings', type: AccountType.EQUITY, sub_type: 'Retained Earnings', is_system: true },

  // ─── REVENUE (4000–4999) ─────────────────────────────────────────────────
  { code: '4000', name: 'Contract Revenue', type: AccountType.INCOME, sub_type: 'Revenue', is_system: true },
  { code: '4100', name: 'Change Order Revenue', type: AccountType.INCOME, sub_type: 'Revenue' },
  { code: '4200', name: 'T&M Revenue', type: AccountType.INCOME, sub_type: 'Revenue', description: 'Time & Material billing' },
  { code: '4300', name: 'Service Revenue', type: AccountType.INCOME, sub_type: 'Revenue' },
  { code: '4900', name: 'Other Income', type: AccountType.INCOME, sub_type: 'Other Income' },

  // ─── COST OF GOODS SOLD / JOB COSTS (5000–5999) ─────────────────────────
  { code: '5000', name: 'Materials', type: AccountType.COST_OF_GOODS_SOLD, sub_type: 'Job Costs', is_system: true },
  { code: '5100', name: 'Labor — Direct', type: AccountType.COST_OF_GOODS_SOLD, sub_type: 'Job Costs', is_system: true },
  { code: '5110', name: 'Labor — Burden', type: AccountType.COST_OF_GOODS_SOLD, sub_type: 'Job Costs', description: 'Payroll taxes and insurance on direct labor' },
  { code: '5200', name: 'Subcontractor Costs', type: AccountType.COST_OF_GOODS_SOLD, sub_type: 'Job Costs', is_system: true },
  { code: '5300', name: 'Equipment Rental', type: AccountType.COST_OF_GOODS_SOLD, sub_type: 'Job Costs' },
  { code: '5400', name: 'Permits & Fees', type: AccountType.COST_OF_GOODS_SOLD, sub_type: 'Job Costs' },
  { code: '5500', name: 'Other Job Costs', type: AccountType.COST_OF_GOODS_SOLD, sub_type: 'Job Costs' },

  // ─── OVERHEAD / OPERATING EXPENSES (6000–6999) ───────────────────────────
  { code: '6000', name: 'Officer Salary', type: AccountType.EXPENSE, sub_type: 'Payroll Expenses' },
  { code: '6100', name: 'Office Salaries', type: AccountType.EXPENSE, sub_type: 'Payroll Expenses' },
  { code: '6200', name: 'Rent', type: AccountType.EXPENSE, sub_type: 'Facilities' },
  { code: '6300', name: 'Utilities', type: AccountType.EXPENSE, sub_type: 'Facilities' },
  { code: '6400', name: 'Insurance — General Liability', type: AccountType.EXPENSE, sub_type: 'Insurance' },
  { code: '6410', name: "Insurance — Workers' Compensation", type: AccountType.EXPENSE, sub_type: 'Insurance' },
  { code: '6500', name: 'Vehicle Expense', type: AccountType.EXPENSE, sub_type: 'Vehicle' },
  { code: '6600', name: 'Office Supplies', type: AccountType.EXPENSE, sub_type: 'Office Expenses' },
  { code: '6700', name: 'Professional Fees', type: AccountType.EXPENSE, sub_type: 'Professional Services', description: 'CPA, legal, consulting' },
  { code: '6800', name: 'Depreciation Expense', type: AccountType.EXPENSE, sub_type: 'Depreciation' },
  { code: '6900', name: 'Other G&A', type: AccountType.EXPENSE, sub_type: 'General & Administrative' },
];

export async function seedCoa(companyId = COMPANY_ID) {
  console.log(`Seeding COA for company: ${companyId}`);

  let created = 0;
  let updated = 0;

  for (const account of COA) {
    const result = await db.account.upsert({
      where: {
        company_id_code: {
          company_id: companyId,
          code: account.code,
        },
      },
      create: {
        company_id: companyId,
        code: account.code,
        name: account.name,
        type: account.type,
        sub_type: account.sub_type,
        description: account.description,
        is_system: account.is_system ?? false,
        is_active: true,
      },
      update: {
        name: account.name,
        type: account.type,
        sub_type: account.sub_type,
        description: account.description,
        is_system: account.is_system ?? false,
      },
    });

    if (result.created_at.getTime() === result.updated_at.getTime()) {
      created++;
    } else {
      updated++;
    }
  }

  console.log(`COA seed complete: ${created} created, ${updated} updated`);
}

// Run directly if invoked as a script
if (require.main === module) {
  seedCoa()
    .catch((e) => {
      console.error('Seed failed:', e);
      process.exit(1);
    })
    .finally(() => db.$disconnect());
}
