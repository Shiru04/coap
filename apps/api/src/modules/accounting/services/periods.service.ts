import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { AuditService } from './audit.service';
import { LockPeriodDto, UnlockPeriodDto } from '../dto/lock-period.dto';

@Injectable()
export class PeriodsService {
  constructor(
    private readonly db: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(companyId: string, fiscalYearId?: string) {
    return this.db.accountingPeriod.findMany({
      where: {
        company_id: companyId,
        ...(fiscalYearId ? { fiscal_year_id: fiscalYearId } : {}),
      },
      orderBy: [{ fiscal_year_id: 'asc' }, { period_number: 'asc' }],
      include: { fiscal_year: { select: { name: true } } },
    });
  }

  async lock(companyId: string, id: string, userId: string, dto: LockPeriodDto) {
    const period = await this.db.accountingPeriod.findFirst({
      where: { id, company_id: companyId },
    });
    if (!period) throw new NotFoundException(`Period ${id} not found`);
    if (period.is_closed) throw new ConflictException(`Period ${period.name} is already locked`);

    const before = { ...period };
    const updated = await this.db.accountingPeriod.update({
      where: { id },
      data: {
        is_closed: true,
        closed_at: new Date(),
        closed_by: userId,
      },
    });

    await this.audit.log({
      company_id: companyId,
      user_id: userId,
      action: 'LOCK',
      entity_type: 'AccountingPeriod',
      entity_id: id,
      before,
      after: { ...updated, reason: dto.reason },
    });

    return updated;
  }

  async unlock(companyId: string, id: string, userId: string, dto: UnlockPeriodDto) {
    const period = await this.db.accountingPeriod.findFirst({
      where: { id, company_id: companyId },
    });
    if (!period) throw new NotFoundException(`Period ${id} not found`);
    if (!period.is_closed) throw new ConflictException(`Period ${period.name} is not locked`);

    // Check if the parent fiscal year is closed — cannot unlock period of a closed year
    const fiscalYear = await this.db.fiscalYear.findFirst({
      where: { id: period.fiscal_year_id, company_id: companyId },
    });
    if (fiscalYear?.is_closed) {
      throw new ForbiddenException(
        `Cannot unlock period: fiscal year ${fiscalYear.name} is closed`,
      );
    }

    const before = { ...period };
    const updated = await this.db.accountingPeriod.update({
      where: { id },
      data: {
        is_closed: false,
        closed_at: null,
        closed_by: null,
      },
    });

    await this.audit.log({
      company_id: companyId,
      user_id: userId,
      action: 'UNLOCK',
      entity_type: 'AccountingPeriod',
      entity_id: id,
      before,
      after: { ...updated, reason: dto.reason },
    });

    return updated;
  }

  /** Returns the accounting period that contains the given date, or null */
  async findPeriodForDate(companyId: string, date: Date) {
    return this.db.accountingPeriod.findFirst({
      where: {
        company_id: companyId,
        start_date: { lte: date },
        end_date: { gte: date },
      },
    });
  }
}
