import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { addMonths, endOfMonth, startOfMonth, format } from 'date-fns';
import { PrismaService } from '../../../database/prisma.service';
import { AuditService } from './audit.service';
import { CreateFiscalYearDto } from '../dto/create-fiscal-year.dto';

@Injectable()
export class FiscalYearsService {
  constructor(
    private readonly db: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(companyId: string) {
    return this.db.fiscalYear.findMany({
      where: { company_id: companyId },
      orderBy: { start_date: 'desc' },
      include: {
        periods: {
          orderBy: { period_number: 'asc' },
        },
      },
    });
  }

  async findOne(companyId: string, id: string) {
    const fy = await this.db.fiscalYear.findFirst({
      where: { id, company_id: companyId },
      include: {
        periods: { orderBy: { period_number: 'asc' } },
      },
    });
    if (!fy) throw new NotFoundException(`Fiscal year ${id} not found`);
    return fy;
  }

  async create(companyId: string, dto: CreateFiscalYearDto, userId: string) {
    const existing = await this.db.fiscalYear.findFirst({
      where: { company_id: companyId, name: dto.name },
    });
    if (existing) {
      throw new ConflictException(`Fiscal year ${dto.name} already exists`);
    }

    const startDate = startOfMonth(new Date(dto.start_date));
    const endDate = endOfMonth(addMonths(startDate, 11));

    // Build 12 monthly periods
    const periodData = Array.from({ length: 12 }, (_, i) => {
      const periodStart = startOfMonth(addMonths(startDate, i));
      const periodEnd = endOfMonth(addMonths(startDate, i));
      return {
        company_id: companyId,
        period_number: i + 1,
        name: format(periodStart, 'MMMM yyyy'),
        start_date: periodStart,
        end_date: periodEnd,
      };
    });

    const fiscalYear = await this.db.fiscalYear.create({
      data: {
        company_id: companyId,
        name: dto.name,
        start_date: startDate,
        end_date: endDate,
        periods: { create: periodData },
      },
      include: { periods: { orderBy: { period_number: 'asc' } } },
    });

    await this.audit.log({
      company_id: companyId,
      user_id: userId,
      action: 'CREATE',
      entity_type: 'FiscalYear',
      entity_id: fiscalYear.id,
      after: fiscalYear,
    });

    return fiscalYear;
  }

  async close(companyId: string, id: string, userId: string) {
    const fy = await this.db.fiscalYear.findFirst({
      where: { id, company_id: companyId },
      include: { periods: true },
    });
    if (!fy) throw new NotFoundException(`Fiscal year ${id} not found`);
    if (fy.is_closed) throw new ConflictException(`Fiscal year ${fy.name} is already closed`);

    // Ensure all periods are locked before closing year
    const openPeriods = fy.periods.filter((p) => !p.is_closed);
    if (openPeriods.length > 0) {
      throw new BadRequestException(
        `Cannot close fiscal year: ${openPeriods.length} period(s) are still open. Lock all periods first.`,
      );
    }

    const before = { ...fy, periods: undefined };
    const updated = await this.db.fiscalYear.update({
      where: { id },
      data: {
        is_closed: true,
        closed_at: new Date(),
        closed_by: userId,
      },
      include: { periods: { orderBy: { period_number: 'asc' } } },
    });

    await this.audit.log({
      company_id: companyId,
      user_id: userId,
      action: 'CLOSE',
      entity_type: 'FiscalYear',
      entity_id: id,
      before,
      after: updated,
    });

    return updated;
  }
}
