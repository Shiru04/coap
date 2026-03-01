/**
 * Main seed entry point.
 * Run: pnpm --filter @coap/database db:seed
 */
import { PrismaClient } from '@prisma/client';
import { seedCoa } from '../prisma/seeds/coa-construction';

const db = new PrismaClient();

async function main() {
  const companyId = process.env.DEFAULT_COMPANY_ID ?? 'coap-default-company';
  console.log('Starting database seed...');
  await seedCoa(companyId);
  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
